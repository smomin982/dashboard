import { DashboardData } from './types';

// Helper to generate a date string offset by days
const getOffsetDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const mockDashboardData: DashboardData = {
  kpis: {
    totalUsers: 12450,
    activeUsers: 3200,
    totalConversations: 85300,
    totalMessages: 341200,
    totalQueries: 95000,
    totalVisualizations: 45200,
    avgSessionDurationSec: 420,
  },
  trends: Array.from({ length: 30 }).map((_, i) => ({
    date: getOffsetDate(29 - i),
    dau: Math.floor(1000 + Math.random() * 500 + i * 20),
    queries: Math.floor(3000 + Math.random() * 1000 + i * 50),
    visualizations: Math.floor(1500 + Math.random() * 800 + i * 30),
  })),
  categories: [
    { category: "Youth Unemployment", count: 4200 },
    { category: "Healthcare Policies", count: 3100 },
    { category: "Economic Reform", count: 2800 },
    { category: "Education Subsidies", count: 2100 },
    { category: "Climate Action", count: 1800 },
    { category: "Housing Affordability", count: 1200 },
  ],
  geography: [
    { country: "United States", count: 4500 },
    { country: "United Kingdom", count: 2100 },
    { country: "Canada", count: 1800 },
    { country: "Australia", count: 1200 },
    { country: "Germany", count: 900 },
    { country: "France", count: 700 },
  ],
  adoption: [
    { feature: "Saved Items", adoptedUsers: 4500, totalUsers: 12450, percentage: 36.1 },
    { feature: "Pinned Conversations", adoptedUsers: 3100, totalUsers: 12450, percentage: 24.9 },
    { feature: "Data Export", adoptedUsers: 1800, totalUsers: 12450, percentage: 14.5 },
  ],
  engagement: {
    avgFollowUpQuestions: 2.4,
    avgMessagesPerConversation: 4.0,
  },
  themes: [
    { theme: "dark", count: 8500 },
    { theme: "light", count: 2200 },
    { theme: "system", count: 1750 },
  ],
};
