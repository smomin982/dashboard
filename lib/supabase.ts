import { createClient } from '@supabase/supabase-js';
import { DashboardData } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create the client only if env variables are provided
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Helper to check if real-time data should be used
export const isRealSupabaseConfigured = () => supabase !== null;

// Represents a query result: null means "could not read" (e.g. RLS), 0 means genuinely zero rows.
interface RawKPIs {
  totalUsers: number | null;
  totalConversations: number | null;
  totalMessages: number | null;
  totalQueries: number | null;
  totalVisualizations: number | null;
  avgSessionDurationSec: number | null;
}

export interface FetchResult {
  data: DashboardData;
  errors: string[]; // non-fatal errors logged per query for transparency
}

export const fetchDashboardData = async (days: string = '7', region: string = 'all'): Promise<FetchResult> => {
  if (!supabase) {
    return { data: emptyDashboard(), errors: ['NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set.'] };
  }

  try {
    const params = new URLSearchParams({ days, region });
    const response = await fetch(`/api/metrics?${params.toString()}`);
    if (!response.ok) {
      const text = await response.text();
      return { data: emptyDashboard(), errors: [`Failed to fetch from /api/metrics: ${response.status} ${text}`] };
    }
    const result = await response.json();
    return result as FetchResult;
  } catch (error: any) {
    console.error("Error calling /api/metrics:", error);
    return { data: emptyDashboard(), errors: [error.message || 'Unknown error calling /api/metrics'] };
  }
};

// An empty-but-valid dashboard state (shown when Supabase is not configured)
function emptyDashboard(): DashboardData {
  return {
    kpis: {
      totalUsers: 0,
      totalConversations: 0,
      totalMessages: 0,
      totalQueries: 0,
      totalVisualizations: 0,
      avgSessionDurationSec: 0,
    },
    trends: [],
    categories: [],
    geography: [],
    adoption: [],
    engagement: { avgFollowUpQuestions: 0, avgMessagesPerConversation: 0 },
    themes: [],
  };
}
