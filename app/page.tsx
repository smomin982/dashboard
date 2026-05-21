'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { MetricCard } from '../components/MetricCard';
import { FilterControls } from '../components/FilterControls';
import { TrendChart, CategoryChart, GeoChart, AdoptionChart } from '../components/Charts';
import { Users, MessageSquare, Database, Clock, HelpCircle, AlertTriangle, Wifi } from 'lucide-react';
import { DashboardData } from '../lib/types';
import { supabase, isRealSupabaseConfigured, fetchDashboardData } from '../lib/supabase';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [queryErrors, setQueryErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [days, setDays] = useState('7');
  const [region, setRegion] = useState('all');

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;

    const loadData = async () => {
      setLoading(true);
      const { data: result, errors } = await fetchDashboardData(days, region);
      if (!active) return;
      setData(result);
      setQueryErrors(errors);
      setIsLive(isRealSupabaseConfigured() && errors.length === 0);
      setLoading(false);
    };

    loadData();

    if (isRealSupabaseConfigured() && supabase) {
      channel = supabase.channel('dashboard-realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'usage_summary' }, () => loadData())
        .subscribe();
    }

    return () => {
      active = false;
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [days, region]);

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
        fontFamily: 'var(--font-inter, sans-serif)'
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid var(--border-color)',
          borderTop: '3px solid var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '14px' }}>Connecting to Supabase…</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <DashboardLayout>

      {/* ── Connection Status Banner ── */}
      {queryErrors.length > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 600, fontSize: '13px' }}>
            <AlertTriangle size={15} />
            Some queries returned errors (check RLS policies or column names):
          </div>
          {queryErrors.map((e, i) => (
            <div key={i} style={{ color: 'var(--text-secondary)', fontSize: '12px', paddingLeft: '23px', fontFamily: 'monospace' }}>
              {e}
            </div>
          ))}
        </div>
      )}

      {isLive && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '16px',
          color: 'var(--success)',
          fontSize: '12px',
          fontWeight: 600
        }}>
          <Wifi size={13} />
          Connected to Supabase — live data
        </div>
      )}

      <FilterControls days={days} setDays={setDays} region={region} setRegion={setRegion} />

      {/* KPIs */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Users"
          value={data.kpis.totalUsers.toLocaleString()}
          icon={Users}
        />
        <MetricCard
          title="Conversations"
          value={data.kpis.totalConversations.toLocaleString()}
          icon={MessageSquare}
        />
        <MetricCard
          title="User Messages"
          value={data.kpis.totalQueries.toLocaleString()}
          icon={Database}
        />
        <MetricCard
          title="Avg Session (s)"
          value={data.kpis.avgSessionDurationSec.toLocaleString()}
          icon={Clock}
        />
        <MetricCard
          title="Avg Follow-ups"
          value={data.engagement.avgFollowUpQuestions}
          icon={HelpCircle}
        />
      </div>

      {/* Charts Row 1 — Trend */}
      {data.trends.length > 0 ? (
        <div className="charts-grid">
          <div className="chart-full-width">
            <TrendChart data={data.trends} />
          </div>
        </div>
      ) : (
        <EmptyState label="No daily usage data yet (usage_summary is empty)" />
      )}

      {/* Charts Row 2 — Category + Geo */}
      <div className="charts-grid">
        {data.categories.length > 0
          ? <CategoryChart data={data.categories} />
          : <EmptyState label="No category/indicator data from projects table" />}
        {data.geography.length > 0
          ? <GeoChart data={data.geography} />
          : <EmptyState label="No country data from projects table" />}
      </div>

      {/* Charts Row 3 — Adoption + Insights */}
      <div className="charts-grid">
        {data.adoption.length > 0
          ? <AdoptionChart data={data.adoption} />
          : <EmptyState label="No feature adoption data available" />}

        <div className="glass-panel chart-container fade-in" style={{ animationDelay: '0.6s' }}>
          <h3 className="chart-title">Live Insights</h3>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <InsightRow
              label="Total Messages Sent"
              value={data.kpis.totalMessages.toLocaleString()}
              color="var(--accent-primary)"
            />
            <InsightRow
              label="Avg Messages / Conversation"
              value={data.engagement.avgMessagesPerConversation.toString()}
              color="var(--accent-secondary)"
            />
            <InsightRow
              label="Users Who Saved Items"
              value={`${data.adoption.find(a => a.feature === 'Saved Items')?.adoptedUsers ?? 0} users`}
              color="#34d399"
            />
            {data.categories[0] && (
              <InsightRow
                label="Top Indicator Category"
                value={`${data.categories[0].category} (${data.categories[0].count})`}
                color="var(--accent-primary)"
              />
            )}
            {data.geography[0] && (
              <InsightRow
                label="Top Country"
                value={`${data.geography[0].country} (${data.geography[0].count})`}
                color="var(--success)"
              />
            )}
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="glass-panel chart-container" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '40px'
    }}>
      {label}
    </div>
  );
}

function InsightRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
      <span>{label}</span>
      <span style={{ color, fontWeight: 700, fontSize: '13px' }}>{value}</span>
    </div>
  );
}
