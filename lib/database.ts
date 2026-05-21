// ============================================================================
// Supabase Database Types
// Auto-generated from schema.sql - November 29, 2025
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================================
// Table Types
// ============================================================================

export interface Profile {
  id: string; // UUID, references auth.users
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  organization: string | null;
  job_title: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  // UI Preferences
  theme: "light" | "dark" | "system";
  // Default Settings
  default_country: string | null;
  // Visualization Preferences
  preferred_chart_type: string;
  show_data_labels: boolean;
  animation_enabled: boolean;
  // Chat Preferences
  show_citations: boolean;
  auto_scroll: boolean;
  // Onboarding
  has_completed_onboarding: boolean;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  country: string | null;
  region: string | null;
  indicators: string[];
  settings: Json;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string | null;
  summary: string | null;
  message_count: number;
  last_message_at: string | null;
  project_context: Json;
  is_archived: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: Json;
  hits: Json;
  visualizations: Json;
  follow_up_questions: string[];
  metadata: Json;
  is_bookmarked: boolean;
  created_at: string;
}

export type SavedItemType =
  | "insight"
  | "visualization"
  | "query"
  | "citation"
  | "response";

export interface SavedItem {
  id: string;
  user_id: string;
  message_id: string | null;
  conversation_id: string | null;
  item_type: SavedItemType;
  title: string | null;
  content: string | null;
  visualization_data: Json | null;
  image_base64: string | null;
  query_text: string | null;
  tags: string[];
  folder: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// F3: Narrowed to only the event types allowed by the DB CHECK constraint
// and actually fired by the frontend (session_start via trackEvent, session_end via trackSessionEnd).
export type UsageEventType = "session_start" | "session_end";

export interface UsageAnalytics {
  id: string;
  user_id: string;
  user_email: string | null;
  event_type: UsageEventType;
  event_data: Json;
  conversation_id: string | null;
  project_id: string | null;
  session_id: string | null;
  query_text: string | null;
  response_time_ms: number | null;
  created_at: string;
}

export interface UsageSummary {
  user_id: string;
  user_email: string | null;
  date: string;
  query_count: number;
  visualization_count: number;
  export_count: number;
  conversation_count: number;
  unique_visits: number;
  session_duration_seconds: number;
  updated_at: string;
}

// ============================================================================
// View Types
// ============================================================================

export interface UserStats {
  user_id: string;
  full_name: string | null;
  email: string | null;
  total_conversations: number;
  total_messages: number;
  total_saved_items: number;
  total_projects: number;
  total_queries: number;
  total_visualizations: number;
}

export interface RecentConversation extends Conversation {
  first_query: string | null;
  last_message: string | null;
}

// ============================================================================
// Insert/Update Types (for creating/updating records)
// ============================================================================

export interface ProfileInsert {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  organization?: string | null;
  job_title?: string | null;
}

export interface ProfileUpdate {
  full_name?: string | null;
  avatar_url?: string | null;
  organization?: string | null;
  job_title?: string | null;
}

export interface UserPreferencesUpdate {
  theme?: "light" | "dark" | "system";
  default_country?: string | null;
  preferred_chart_type?: string;
  show_data_labels?: boolean;
  animation_enabled?: boolean;
  show_citations?: boolean;
  auto_scroll?: boolean;
}

export interface ProjectInsert {
  user_id: string;
  name: string;
  description?: string | null;
  country?: string | null;
  region?: string | null;
  indicators?: string[];
  settings?: Json;
  is_default?: boolean;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
  country?: string | null;
  region?: string | null;
  indicators?: string[];
  settings?: Json;
  is_default?: boolean;
}

export interface ConversationInsert {
  user_id: string;
  project_id?: string | null;
  title?: string | null;
  summary?: string | null;
  project_context?: Json;
  is_pinned?: boolean;
}

export interface ConversationUpdate {
  title?: string | null;
  summary?: string | null;
  project_context?: Json;
  is_archived?: boolean;
  is_pinned?: boolean;
}

export interface MessageInsert {
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: Json;
  hits?: Json;
  visualizations?: Json;
  follow_up_questions?: string[];
  metadata?: Json;
  is_bookmarked?: boolean;
}

export interface MessageUpdate {
  is_bookmarked?: boolean;
  metadata?: Json;
}

export interface SavedItemInsert {
  user_id: string;
  message_id?: string | null;
  conversation_id?: string | null;
  item_type: SavedItemType;
  title?: string | null;
  content?: string | null;
  visualization_data?: Json | null;
  image_base64?: string | null;
  query_text?: string | null;
  tags?: string[];
  folder?: string | null;
  notes?: string | null;
}

export interface SavedItemUpdate {
  title?: string | null;
  content?: string | null;
  tags?: string[];
  folder?: string | null;
  notes?: string | null;
}

export interface UsageAnalyticsInsert {
  user_id: string;
  user_email?: string | null;
  event_type: UsageEventType;
  event_data?: Json;
  session_id?: string | null;
}

// ============================================================================
// Database Type (for Supabase client)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: { user_id: string } & Partial<UserPreferencesUpdate>;
        Update: UserPreferencesUpdate;
      };
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
      conversations: {
        Row: Conversation;
        Insert: ConversationInsert;
        Update: ConversationUpdate;
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: MessageUpdate;
      };
      saved_items: {
        Row: SavedItem;
        Insert: SavedItemInsert;
        Update: SavedItemUpdate;
      };
      usage_analytics: {
        Row: UsageAnalytics;
        Insert: UsageAnalyticsInsert;
        Update: never;
      };
      usage_summary: {
        Row: UsageSummary;
        Insert: never;
        Update: never;
      };
    };
    Views: {
      user_stats: {
        Row: UserStats;
      };
      recent_conversations: {
        Row: RecentConversation;
      };
    };
    Functions: {
      increment_usage: {
        Args: {
          p_user_id: string;
          p_field: string;
          p_email?: string | null;
          p_session_duration_seconds?: number | null;
        };
        Returns: void;
      };
    };
  };
}
