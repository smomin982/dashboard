import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This route runs SERVER-SIDE only. The service_role key is never sent to the browser.
// It bypasses RLS so we can aggregate data across all users for admin analytics.

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: Request) {
  const supabase = getAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        data: emptyDashboard(),
        errors: ['SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (without NEXT_PUBLIC_ prefix).'],
      },
      { status: 200 }
    );
  }

  const { searchParams } = new URL(request.url);
  const days = searchParams.get('days') || '7';
  const region = searchParams.get('region') || 'all';

  let dateFilter = '';
  if (days !== 'all') {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(days));
    dateFilter = d.toISOString();
  }

  const applyDate = (query: any, field: string = 'created_at') => {
    return dateFilter ? query.gte(field, dateFilter) : query;
  };

  const applyRegion = (query: any) => {
    // Only apply region if we know the table supports it, e.g., if there's a join or field.
    // For now, most tables don't have region directly without joins, so we'll stick to Date filtering for core metrics.
    return query;
  };

  const errors: string[] = [];

  // ── 1. KPI COUNTS ──────────────────────────────────────────────────────────
  const [profilesRes, convsRes, allMsgsRes, userMsgsRes, visItemsRes] = await Promise.all([
    applyDate(supabase.from('profiles').select('*', { count: 'exact', head: true })),
    applyDate(supabase.from('conversations').select('*', { count: 'exact', head: true })),
    applyDate(supabase.from('messages').select('*', { count: 'exact', head: true })),
    applyDate(supabase.from('messages').select('*', { count: 'exact', head: true })).eq('role', 'user'),
    applyDate(supabase.from('saved_items').select('*', { count: 'exact', head: true })).eq('item_type', 'visualization'),
  ]);

  if (profilesRes.error) errors.push(`profiles: ${profilesRes.error.message}`);
  if (convsRes.error) errors.push(`conversations: ${convsRes.error.message}`);
  if (allMsgsRes.error) errors.push(`messages (all): ${allMsgsRes.error.message}`);
  if (userMsgsRes.error) errors.push(`messages (user): ${userMsgsRes.error.message}`);
  if (visItemsRes.error) errors.push(`saved_items (vis): ${visItemsRes.error.message}`);

  const totalUsers = profilesRes.count ?? 0;
  const totalConversations = convsRes.count ?? 0;
  const totalMessages = allMsgsRes.count ?? 0;
  const totalQueries = userMsgsRes.count ?? 0;
  const totalVisualizations = visItemsRes.count ?? 0;

  // ── 2. USAGE SUMMARY → avg session duration + daily trend ─────────────────
  const usageRes = await applyDate(supabase.from('usage_summary').select('session_duration_seconds, unique_visits, query_count, visualization_count, date'), 'date').order('date', { ascending: true });

  if (usageRes.error) errors.push(`usage_summary: ${usageRes.error.message}`);

  const usageRows = usageRes.data ?? [];
  let avgSessionDurationSec = 0;
  const trendsMap: Record<string, { date: string; dau: number; queries: number; visualizations: number }> = {};

  if (usageRows.length > 0) {
    let totalDuration = 0;
    let totalVisits = 0;

    usageRows.forEach((row: any) => {
      totalDuration += row.session_duration_seconds ?? 0;
      totalVisits += row.unique_visits ?? 0;

      const d = row.date as string;
      if (!trendsMap[d]) trendsMap[d] = { date: d, dau: 0, queries: 0, visualizations: 0 };
      trendsMap[d].dau += row.unique_visits ?? 0;
      trendsMap[d].queries += row.query_count ?? 0;
      trendsMap[d].visualizations += row.visualization_count ?? 0;
    });

    avgSessionDurationSec = totalVisits > 0 ? Math.round(totalDuration / totalVisits) : 0;
  }

  const trends = Object.values(trendsMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  // ── 3. GEOGRAPHY + CATEGORIES from projects ────────────────────────────────
  const projRes = await supabase.from('projects').select('country, indicators');
  if (projRes.error) errors.push(`projects: ${projRes.error.message}`);

  const projRows = projRes.data ?? [];
  const countryMap: Record<string, number> = {};
  const categoryMap: Record<string, number> = {};

  projRows.forEach((p: any) => {
    if (p.country) countryMap[p.country] = (countryMap[p.country] ?? 0) + 1;
    (p.indicators as string[] | null)?.forEach((ind: string) => {
      categoryMap[ind] = (categoryMap[ind] ?? 0) + 1;
    });
  });

  const geography = Object.entries(countryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  const categories = Object.entries(categoryMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // ── 4. CATEGORY INSIGHTS FROM CONVERSATIONS ────────────────────────────────
  // Extract topic categories from conversation titles (the actual user questions)
  const convTitlesRes = await supabase
    .from('conversations')
    .select('title')
    .not('title', 'is', null);

  if (convTitlesRes.error) errors.push(`conversations (titles): ${convTitlesRes.error.message}`);

  const convTitles = convTitlesRes.data ?? [];
  const topicMap: Record<string, number> = {};

  // Keyword-based topic extraction from conversation titles
  const topicKeywords: Record<string, string[]> = {
    'Youth Unemployment': ['unemployment', 'youth employment', 'job', 'employment rate'],
    'Education': ['education', 'school', 'literacy', 'enrollment', 'student'],
    'Healthcare': ['health', 'malaria', 'stunting', 'mortality', 'anaemia', 'disease', 'medical', 'hospital', 'vaccine'],
    'Economic Development': ['economic', 'gdp', 'poverty', 'income', 'trade', 'economy', 'renewable energy'],
    'Governance': ['government', 'governance', 'policy', 'institutions', 'corruption'],
    'Infrastructure': ['infrastructure', 'road', 'traffic', 'transport', 'electricity'],
    'Agriculture': ['agriculture', 'food', 'farming', 'crop'],
    'Climate & Environment': ['climate', 'environment', 'emissions', 'pollution', 'water'],
    'Gender & Equality': ['gender', 'women', 'inequality', 'equality', 'labour force participation'],
    'Demographics': ['population', 'birth', 'death', 'migration', 'children'],
  };

  convTitles.forEach((c: any) => {
    const title = (c.title as string).toLowerCase();
    let matched = false;
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(kw => title.includes(kw))) {
        topicMap[topic] = (topicMap[topic] ?? 0) + 1;
        matched = true;
        break; // one topic per conversation
      }
    }
    if (!matched) {
      topicMap['Other'] = (topicMap['Other'] ?? 0) + 1;
    }
  });

  const conversationTopics = Object.entries(topicMap)
    .map(([topic, count]) => ({ category: topic, count }))
    .sort((a, b) => b.count - a.count);

  // Merge project-based categories with conversation-based topics
  // Prefer conversation topics if available since they represent actual user questions
  const finalCategories = conversationTopics.length > 0 ? conversationTopics : categories;

  // ── 5. GEOGRAPHY FROM CONVERSATION CONTENT ─────────────────────────────────
  // Extract countries mentioned in conversation titles as a secondary geo source
  const countryKeywords: Record<string, string[]> = {
    'Nigeria': ['nigeria', 'nigerian'],
    'Kenya': ['kenya', 'kenyan', 'kenia'],
    'India': ['india', 'indian'],
    'Tanzania': ['tanzania', 'tanzanian'],
    'South Africa': ['south africa'],
    'Ghana': ['ghana'],
    'Uganda': ['uganda'],
    'Ethiopia': ['ethiopia'],
    'Bangladesh': ['bangladesh'],
    'Pakistan': ['pakistan'],
    'United States': ['united states', 'usa', 'america'],
    'United Kingdom': ['united kingdom', 'uk', 'britain'],
    'Mongolia': ['mongolia', 'mongolian'],
    'Burundi': ['burundi'],
  };

  const convCountryMap: Record<string, number> = {};
  convTitles.forEach((c: any) => {
    const title = (c.title as string).toLowerCase();
    for (const [country, keywords] of Object.entries(countryKeywords)) {
      if (keywords.some(kw => title.includes(kw))) {
        convCountryMap[country] = (convCountryMap[country] ?? 0) + 1;
      }
    }
  });

  const convGeography = Object.entries(convCountryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  // Use project geography if available, otherwise conversation-based geography
  const finalGeography = geography.length > 0 ? geography : convGeography;

  // ── 6. FEATURE ADOPTION ────────────────────────────────────────────────────
  const [savedRes, pinnedRes, exportRes, allProfilesRes] = await Promise.all([
    supabase.from('saved_items').select('user_id'),
    supabase.from('conversations').select('user_id').eq('is_pinned', true),
    supabase.from('usage_summary').select('user_id').gt('export_count', 0),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
  ]);

  if (savedRes.error) errors.push(`saved_items (adoption): ${savedRes.error.message}`);
  if (pinnedRes.error) errors.push(`conversations (pinned): ${pinnedRes.error.message}`);
  if (exportRes.error) errors.push(`usage_summary (export): ${exportRes.error.message}`);
  if (allProfilesRes.error) errors.push(`profiles (all): ${allProfilesRes.error.message}`);

  const savedAdopters = new Set(savedRes.data?.map((s: any) => s.user_id) ?? []).size;
  const pinnedAdopters = new Set(pinnedRes.data?.map((c: any) => c.user_id) ?? []).size;
  const exportAdopters = new Set(exportRes.data?.map((e: any) => e.user_id) ?? []).size;
  const allTimeUsers = allProfilesRes.count ?? totalUsers;

  const adoption = [
    {
      feature: 'Saved Items',
      adoptedUsers: savedAdopters,
      totalUsers: allTimeUsers,
      percentage: allTimeUsers > 0 ? Number(((savedAdopters / allTimeUsers) * 100).toFixed(1)) : 0,
    },
    {
      feature: 'Pinned Conversations',
      adoptedUsers: pinnedAdopters,
      totalUsers: allTimeUsers,
      percentage: allTimeUsers > 0 ? Number(((pinnedAdopters / allTimeUsers) * 100).toFixed(1)) : 0,
    },
    {
      feature: 'Data Export',
      adoptedUsers: exportAdopters,
      totalUsers: allTimeUsers,
      percentage: allTimeUsers > 0 ? Number(((exportAdopters / allTimeUsers) * 100).toFixed(1)) : 0,
    },
  ];

  // ── 7. ENGAGEMENT ──────────────────────────────────────────────────────────
  const msgEngRes = await supabase.from('messages').select('follow_up_questions');
  if (msgEngRes.error) errors.push(`messages (engagement): ${msgEngRes.error.message}`);

  const msgRows = msgEngRes.data ?? [];
  const totalFollowUps = msgRows.reduce(
    (acc: number, m: any) => acc + ((m.follow_up_questions as string[] | null)?.length ?? 0),
    0
  );
  const avgFollowUpQuestions = msgRows.length > 0 ? Number((totalFollowUps / msgRows.length).toFixed(1)) : 0;
  const avgMessagesPerConversation = totalConversations > 0
    ? Number((totalMessages / totalConversations).toFixed(1))
    : 0;

  // ── 8. THEME PREFERENCES ───────────────────────────────────────────────────
  const prefRes = await supabase.from('user_preferences').select('theme');
  if (prefRes.error) errors.push(`user_preferences: ${prefRes.error.message}`);

  const prefRows = prefRes.data ?? [];
  const themeMap: Record<string, number> = { dark: 0, light: 0, system: 0 };
  prefRows.forEach((p: any) => {
    const t = p.theme as string;
    if (t in themeMap) themeMap[t]++;
  });
  const themes = [
    { theme: 'dark' as const, count: themeMap.dark },
    { theme: 'light' as const, count: themeMap.light },
    { theme: 'system' as const, count: themeMap.system },
  ];

  // ── ASSEMBLE ───────────────────────────────────────────────────────────────
  return NextResponse.json({
    data: {
      kpis: {
        totalUsers,
        totalConversations,
        totalMessages,
        totalQueries,
        totalVisualizations,
        avgSessionDurationSec,
      },
      trends,
      categories: finalCategories,
      geography: finalGeography,
      adoption,
      engagement: { avgFollowUpQuestions, avgMessagesPerConversation },
      themes,
    },
    errors,
  });
}

function emptyDashboard() {
  return {
    kpis: {
      totalUsers: 0, totalConversations: 0, totalMessages: 0,
      totalQueries: 0, totalVisualizations: 0, avgSessionDurationSec: 0,
    },
    trends: [],
    categories: [],
    geography: [],
    adoption: [],
    engagement: { avgFollowUpQuestions: 0, avgMessagesPerConversation: 0 },
    themes: [],
  };
}
