'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { MetricCard } from '../components/MetricCard';
import { FilterControls } from '../components/FilterControls';
import { TrendChart, CategoryChart, GeoChart, AdoptionChart } from '../components/Charts';
import {
  Users, Activity, MessageSquare, Database, Clock, HelpCircle, AlertTriangle, BarChart3,
} from 'lucide-react';
import { DashboardData } from '../lib/types';
import { supabase, isRealSupabaseConfigured, fetchDashboardData } from '../lib/supabase';
import { TractionSection } from '../components/TractionSection';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [queryErrors, setQueryErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [days, setDays] = useState('7');

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;

    const loadData = async () => {
      setLoading(true);
      const { data: result, errors } = await fetchDashboardData(days);
      if (!active) return;
      setData(result);
      setQueryErrors(errors);
      // "Live" means we reached Supabase. Per-query errors are surfaced in the
      // banner but should not flip the whole dashboard to "not connected".
      setIsLive(isRealSupabaseConfigured());
      setLoading(false);
    };

    loadData();

    if (isRealSupabaseConfigured() && supabase) {
      channel = supabase.channel('dashboard-realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'usage_analytics' }, () => loadData())
        .subscribe();
    }

    return () => {
      active = false;
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [days]);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        color: 'var(--text-secondary)',
        background: 'var(--bg-primary)',
        fontFamily: 'var(--font-inter, sans-serif)',
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid var(--border-color)',
          borderTop: '3px solid var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '14px' }}>Connecting to Supabase…</span>
      </div>
    );
  }

  if (!data) return null;

  const period = periodLabel(days);

  return (
    <DashboardLayout isLive={isLive}>

      {/* ── Per-query error banner ── */}
      {queryErrors.length > 0 && (
        <div className="banner banner--warning">
          <div className="banner__title">
            <AlertTriangle size={15} />
            Some queries returned errors (check RLS policies or column names):
          </div>
          {queryErrors.map((e, i) => (
            <div key={i} className="banner__item">{e}</div>
          ))}
        </div>
      )}

      <FilterControls days={days} setDays={setDays} />

      {/* ── Overview ── */}
      <div className="section-head scroll-anchor" id="overview">
        <div>
          <h2 className="section-title">Overview</h2>
          <p className="section-desc">
            Activity reflects {period}. Total Users &amp; Feature Adoption are all-time.
          </p>
        </div>
      </div>

      {/* Headline KPIs */}
      <div className="metrics-grid metrics-grid--primary">
        <MetricCard
          title="Total Users"
          value={data.kpis.totalUsers.toLocaleString()}
          icon={Users}
          caption="all-time"
          variant="primary"
          delay={0}
        />
        <MetricCard
          title="Active Users"
          value={data.kpis.activeUsers.toLocaleString()}
          icon={Activity}
          caption={period}
          delay={0.05}
        />
        <MetricCard
          title="Conversations"
          value={data.kpis.totalConversations.toLocaleString()}
          icon={MessageSquare}
          caption={period}
          delay={0.1}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="metrics-grid">
        <MetricCard
          title="User Messages"
          value={data.kpis.totalQueries.toLocaleString()}
          icon={Database}
          caption={period}
          delay={0.15}
        />
        <MetricCard
          title="Avg Session"
          value={`${data.kpis.avgSessionDurationSec.toLocaleString()}s`}
          icon={Clock}
          caption={period}
          delay={0.2}
        />
        <MetricCard
          title="Avg Follow-ups"
          value={data.engagement.avgFollowUpQuestions}
          icon={HelpCircle}
          caption="per conversation"
          delay={0.25}
        />
      </div>

      {/* ── Trends & Distribution ── */}
      <div className="section-head scroll-anchor" id="trends">
        <div>
          <h2 className="section-title">Trends &amp; Distribution</h2>
          <p className="section-desc">How usage moves over time and where it concentrates</p>
        </div>
      </div>

      {/* Trend (full width) */}
      {data.trends.length > 0 ? (
        <div className="charts-grid">
          <div className="chart-full-width">
            <TrendChart data={data.trends} />
          </div>
        </div>
      ) : (
        <EmptyState label="No daily usage data yet (no session events in usage_analytics)" />
      )}

      {/* Category + Geo */}
      <div className="charts-grid">
        {data.categories.length > 0
          ? <CategoryChart data={data.categories} />
          : <EmptyState label="No category / indicator data from projects table" />}
        {data.geography.length > 0
          ? <GeoChart data={data.geography} />
          : <EmptyState label="No country data from projects table" />}
      </div>

      {/* Adoption + Insights */}
      <div className="charts-grid scroll-anchor" id="insights">
        {data.adoption.length > 0
          ? <AdoptionChart data={data.adoption} />
          : <EmptyState label="No feature adoption data available" />}

        <div className="glass-panel chart-container is-auto fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="chart-head">
            <div>
              <h3 className="chart-title">Live Insights</h3>
              <p className="chart-subtitle">Key highlights pulled from current data</p>
            </div>
            <span className="pill"><BarChart3 size={12} /> snapshot</span>
          </div>
          <div className="insight-list">
            <InsightRow
              label="Total Messages Sent"
              value={data.kpis.totalMessages.toLocaleString()}
              color="var(--accent-primary)"
            />
            <InsightRow
              label="Avg Messages / Conversation"
              value={data.engagement.avgMessagesPerConversation.toString()}
              color="var(--green-400)"
            />
            <InsightRow
              label="Users Who Saved Items"
              value={`${data.adoption.find(a => a.feature === 'Saved Items')?.adoptedUsers ?? 0} users`}
              color="var(--success)"
            />
            {data.categories[0] && (
              <InsightRow
                label="Top Indicator Category"
                value={`${data.categories[0].category} (${data.categories[0].count})`}
                color="var(--green-600)"
              />
            )}
            {data.geography[0] && (
              <InsightRow
                label="Top Country"
                value={`${data.geography[0].country} (${data.geography[0].count})`}
                color="var(--green-300)"
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Growth / Traction ── */}
      <TractionSection days={days} />

    </DashboardLayout>
  );
}

function periodLabel(days: string): string {
  if (days === 'all') return 'all time';
  return `last ${days} days`;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="glass-panel chart-container">
      <div className="empty-state" style={{ margin: 'auto' }}>
        <span className="empty-icon"><BarChart3 size={20} /></span>
        {label}
      </div>
    </div>
  );
}

function InsightRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="insight-row">
      <span className="insight-label">
        <span className="insight-dot" style={{ background: color }} />
        {label}
      </span>
      <span className="insight-value" style={{ color }}>{value}</span>
    </div>
  );
}
