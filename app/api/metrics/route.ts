import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// This route runs SERVER-SIDE only. The service_role key is never sent to the browser.
// It bypasses RLS so we can aggregate data across all users for admin analytics.
//
// Heavy aggregations (daily trends, session length, adoption, engagement, themes)
// are done in Postgres via RPCs defined in
//   supabase_stuff/migrations/20260604120000_dashboard_metrics_rpcs.sql
// This avoids the PostgREST 1000-row default cap that silently truncated the
// previous JS-side aggregations, and sources the real DAU trend from
// usage_analytics instead of the (now one-row-per-user) usage_summary table.

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

// Fetch every row from a table by paging past the 1000-row cap. Used only where
// we still classify text in JS (conversation titles, project countries).
async function fetchAllRows(
  supabase: SupabaseClient,
  table: string,
  columns: string,
  filter: (q: any) => any,
  hardCap = 50000
): Promise<{ rows: any[]; error: string | null }> {
  const pageSize = 1000;
  let from = 0;
  const rows: any[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await filter(
      supabase.from(table).select(columns).range(from, from + pageSize - 1)
    );
    if (error) return { rows, error: error.message };
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize || rows.length >= hardCap) break;
    from += pageSize;
  }
  return { rows, error: null };
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

  // Two representations of the window:
  //  - dateFilterTs : full timestamp, for .gte() on timestamptz columns (KPI head-counts)
  //  - startDate    : YYYY-MM-DD date, passed to the aggregation RPCs (p_start)
  // Both are null/'' for "all time".
  let dateFilterTs = '';
  let startDate: string | null = null;
  if (days !== 'all') {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(days));
    dateFilterTs = d.toISOString();
    startDate = dateFilterTs.slice(0, 10);
  }

  const applyDate = (query: any, field: string = 'created_at') => {
    return dateFilterTs ? query.gte(field, dateFilterTs) : query;
  };

  const errors: string[] = [];

  // Turn a Postgres "function does not exist" error into an actionable hint.
  const rpcError = (label: string, message: string) => {
    if (/function .* does not exist|could not find the function/i.test(message)) {
      errors.push(
        `${label}: aggregation function missing. Apply migration ` +
          `supabase_stuff/migrations/20260604120000_dashboard_metrics_rpcs.sql`
      );
    } else {
      errors.push(`${label}: ${message}`);
    }
  };

  // ── 1. KPI COUNTS ──────────────────────────────────────────────────────────
  // Total Users is ALL-TIME on purpose (a cumulative headline). The other three
  // counts are windowed by the selected period.
  const [usersRes, convsRes, allMsgsRes, userMsgsRes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    applyDate(supabase.from('conversations').select('*', { count: 'exact', head: true })),
    applyDate(supabase.from('messages').select('*', { count: 'exact', head: true })),
    applyDate(supabase.from('messages').select('*', { count: 'exact', head: true })).eq('role', 'user'),
  ]);

  if (usersRes.error) errors.push(`profiles: ${usersRes.error.message}`);
  if (convsRes.error) errors.push(`conversations: ${convsRes.error.message}`);
  if (allMsgsRes.error) errors.push(`messages (all): ${allMsgsRes.error.message}`);
  if (userMsgsRes.error) errors.push(`messages (user): ${userMsgsRes.error.message}`);

  const totalUsers = usersRes.count ?? 0;
  const totalConversations = convsRes.count ?? 0;
  const totalMessages = allMsgsRes.count ?? 0;
  const totalQueries = userMsgsRes.count ?? 0;

  // ── 2. DAILY TRENDS (RPC) → real DAU + queries + visualizations per day ─────
  const trendsRes = await supabase.rpc('dashboard_daily_trends', { p_start: startDate });
  if (trendsRes.error) rpcError('daily trends', trendsRes.error.message);

  const trends = (trendsRes.data ?? []).map((r: any) => ({
    date: r.day as string,
    dau: r.dau as number,
    queries: r.queries as number,
    visualizations: r.visualizations as number,
  }));

  // Visualizations KPI is the windowed total of the same series the chart plots,
  // so the headline number always reconciles with the trend line.
  const totalVisualizations = trends.reduce((acc: number, t: any) => acc + (t.visualizations ?? 0), 0);

  // ── 3. SESSION STATS (RPC) → real avg session length ────────────────────────
  const sessionRes = await supabase.rpc('dashboard_session_stats', { p_start: startDate });
  if (sessionRes.error) rpcError('session stats', sessionRes.error.message);
  const sessionRow = sessionRes.data?.[0] ?? {};
  const avgSessionDurationSec = sessionRow.avg_session_seconds ?? 0;
  const activeUsers = sessionRow.active_users ?? 0;

  // ── 4. GEOGRAPHY + CATEGORIES from projects (paginated, windowed) ───────────
  const projFetch = await fetchAllRows(
    supabase,
    'projects',
    'country, indicators, created_at',
    (q) => applyDate(q)
  );
  if (projFetch.error) errors.push(`projects: ${projFetch.error}`);

  const countryMap: Record<string, number> = {};
  const categoryMap: Record<string, number> = {};
  projFetch.rows.forEach((p: any) => {
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

  // ── 5. TOPIC + COUNTRY EXTRACTION from conversation titles (paginated) ──────
  const titleFetch = await fetchAllRows(
    supabase,
    'conversations',
    'title, created_at',
    (q) => applyDate(q).not('title', 'is', null)
  );
  if (titleFetch.error) errors.push(`conversations (titles): ${titleFetch.error}`);
  const convTitles = titleFetch.rows;

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

  const topicMap: Record<string, number> = {};
  convTitles.forEach((c: any) => {
    const title = (c.title as string).toLowerCase();
    let matched = false;
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((kw) => title.includes(kw))) {
        topicMap[topic] = (topicMap[topic] ?? 0) + 1;
        matched = true;
        break; // one topic per conversation
      }
    }
    if (!matched) topicMap['Other'] = (topicMap['Other'] ?? 0) + 1;
  });

  const conversationTopics = Object.entries(topicMap)
    .map(([topic, count]) => ({ category: topic, count }))
    .sort((a, b) => b.count - a.count);

  // Prefer conversation topics (actual user questions) over project indicators.
  const finalCategories = conversationTopics.length > 0 ? conversationTopics : categories;

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
      if (keywords.some((kw) => title.includes(kw))) {
        convCountryMap[country] = (convCountryMap[country] ?? 0) + 1;
      }
    }
  });

  const convGeography = Object.entries(convCountryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  const finalGeography = geography.length > 0 ? geography : convGeography;

  // ── 6. FEATURE ADOPTION (RPC, all-time) ─────────────────────────────────────
  const adoptionRes = await supabase.rpc('dashboard_adoption');
  if (adoptionRes.error) rpcError('adoption', adoptionRes.error.message);
  const adoptionRow = adoptionRes.data?.[0] ?? {};
  const allTimeUsers = adoptionRow.total_users ?? totalUsers;
  const pct = (n: number) => (allTimeUsers > 0 ? Number(((n / allTimeUsers) * 100).toFixed(1)) : 0);

  const adoption = [
    {
      feature: 'Saved Items',
      adoptedUsers: adoptionRow.saved_users ?? 0,
      totalUsers: allTimeUsers,
      percentage: pct(adoptionRow.saved_users ?? 0),
    },
    {
      feature: 'Pinned Conversations',
      adoptedUsers: adoptionRow.pinned_users ?? 0,
      totalUsers: allTimeUsers,
      percentage: pct(adoptionRow.pinned_users ?? 0),
    },
    {
      feature: 'Data Export',
      adoptedUsers: adoptionRow.export_users ?? 0,
      totalUsers: allTimeUsers,
      percentage: pct(adoptionRow.export_users ?? 0),
    },
  ];

  // ── 7. ENGAGEMENT (RPC, windowed) ───────────────────────────────────────────
  const engRes = await supabase.rpc('dashboard_engagement', { p_start: startDate });
  if (engRes.error) rpcError('engagement', engRes.error.message);
  const engRow = engRes.data?.[0] ?? {};
  const avgFollowUpQuestions = Number(Number(engRow.avg_followups ?? 0).toFixed(1));
  const avgMessagesPerConversation = Number(Number(engRow.avg_msgs_per_conv ?? 0).toFixed(1));

  // ── 8. THEME PREFERENCES (RPC, all-time) ────────────────────────────────────
  const themeRes = await supabase.rpc('dashboard_theme_counts');
  if (themeRes.error) rpcError('themes', themeRes.error.message);
  const themeMap: Record<string, number> = { dark: 0, light: 0, system: 0 };
  (themeRes.data ?? []).forEach((r: any) => {
    if (r.theme in themeMap) themeMap[r.theme] = r.count ?? 0;
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
        activeUsers,
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
      totalQueries: 0, totalVisualizations: 0, avgSessionDurationSec: 0, activeUsers: 0,
    },
    trends: [],
    categories: [],
    geography: [],
    adoption: [],
    engagement: { avgFollowUpQuestions: 0, avgMessagesPerConversation: 0 },
    themes: [],
  };
}
