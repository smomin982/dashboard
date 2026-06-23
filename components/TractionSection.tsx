'use client';
import React, { useEffect, useState } from 'react';
import { MetricCard } from './MetricCard';
import { CompositionPanel } from './traction/CompositionPanel';
import { DepthPanel } from './traction/DepthPanel';
import { Users, Activity, Building2, Database } from 'lucide-react';
import { TractionData, emptyTraction } from '../lib/tractionTypes';

export function TractionSection({ days }: { days: string }) {
  const [view, setView] = useState<'traction' | 'retention'>('traction');
  const [excludeInternal, setExcludeInternal] = useState(true);
  const [data, setData] = useState<TractionData>(emptyTraction());
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const params = new URLSearchParams({ days, excludeInternal: String(excludeInternal) });
      try {
        const res = await fetch(`/api/traction?${params.toString()}`);
        const json = await res.json();
        if (!active) return;
        setData(json.data ?? emptyTraction());
        setErrors(json.errors ?? []);
      } catch (e: any) {
        if (active) setErrors([e?.message ?? 'Failed to load traction data']);
      }
    })();
    return () => { active = false; };
  }, [days, excludeInternal]);

  const tab = (id: 'traction' | 'retention', label: string) => (
    <button onClick={() => setView(id)} className="filter-select"
      style={{ cursor: 'pointer', fontWeight: view === id ? 700 : 400,
        color: view === id ? 'var(--accent-primary)' : 'var(--text-secondary)',
        borderColor: view === id ? 'var(--accent-primary)' : 'var(--border-color)' }}>
      {label}
    </button>
  );

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {tab('traction', 'Traction & Engagement')}
          {tab('retention', 'Retention & Stickiness')}
        </div>
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input type="checkbox" checked={excludeInternal} onChange={(e) => setExcludeInternal(e.target.checked)} />
          Exclude team &amp; test accounts
        </label>
      </div>

      {errors.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'monospace' }}>
          {errors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}

      {view === 'traction' ? (
        <>
          <div className="metrics-grid">
            <MetricCard title="Real Users" value={data.kpis.realUsers.toLocaleString()} icon={Users} />
            <MetricCard title="Active (period)" value={data.kpis.activeUsers.toLocaleString()} icon={Activity} />
            <MetricCard title="Organizations" value={data.kpis.orgCount.toLocaleString()} icon={Building2} />
            <MetricCard title="Queries / Active User" value={data.kpis.avgQueriesPerActive} icon={Database} />
          </div>
          <div className="charts-grid">
            <CompositionPanel rows={data.composition} orgs={data.topOrgs} />
            <DepthPanel depth={data.depth} histogram={data.histogram} powerUsers={data.powerUsers} />
          </div>
        </>
      ) : (
        <div className="glass-panel chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
          Retention &amp; Stickiness — available once Phase 2 ships.
        </div>
      )}
    </div>
  );
}
