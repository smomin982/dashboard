// ============================================================================
// Shared Types for the Dashboard based on the Supabase Schema
// ============================================================================

export interface TopKPIs {
  totalUsers: number;        // all-time cumulative
  activeUsers: number;       // distinct users active in the selected period
  totalConversations: number;
  totalMessages: number;
  totalQueries: number;
  totalVisualizations: number;
  avgSessionDurationSec: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  dau: number;
  queries: number;
  visualizations: number;
}

export interface CategoryInsight {
  category: string;
  count: number;
}

export interface GeoInsight {
  country: string;
  count: number;
}

export interface FeatureAdoption {
  feature: string;
  adoptedUsers: number;
  totalUsers: number;
  percentage: number;
}

export interface EngagementMetrics {
  avgFollowUpQuestions: number;
  avgMessagesPerConversation: number;
}

export interface ThemePreference {
  theme: 'light' | 'dark' | 'system';
  count: number;
}

export interface DashboardData {
  kpis: TopKPIs;
  trends: TimeSeriesDataPoint[];
  categories: CategoryInsight[];
  geography: GeoInsight[];
  adoption: FeatureAdoption[];
  engagement: EngagementMetrics;
  themes: ThemePreference[];
}
