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
    <button onClick={() => setView(id)} type="button" aria-pressed={view === id}>
      {label}
    </button>
  );

  return (
    <div id="traction" className="scroll-anchor" style={{ marginTop: 'var(--space-8)' }}>
      <div className="section-head">
        <div>
          <h2 className="section-title">Growth &amp; Traction</h2>
          <p className="section-desc">Who is using Policy Copilot and how deeply</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div className="segmented">
          {tab('traction', 'Traction & Engagement')}
          {tab('retention', 'Retention & Stickiness')}
        </div>
        <label className="toggle-label">
          <input type="checkbox" checked={excludeInternal} onChange={(e) => setExcludeInternal(e.target.checked)} />
          Exclude team &amp; test accounts
        </label>
      </div>

      {errors.length > 0 && (
        <div className="banner banner--warning" style={{ fontFamily: 'ui-monospace, monospace' }}>
          {errors.map((e, i) => <div key={i} className="banner__item" style={{ paddingLeft: 0 }}>{e}</div>)}
        </div>
      )}

      {view === 'traction' ? (
        <>
          <div className="metrics-grid">
            <MetricCard title="Real Users" value={data.kpis.realUsers.toLocaleString()} icon={Users} caption="excl. team & test" delay={0} />
            <MetricCard title="Active Users" value={data.kpis.activeUsers.toLocaleString()} icon={Activity} caption="in period" delay={0.05} />
            <MetricCard title="Organizations" value={data.kpis.orgCount.toLocaleString()} icon={Building2} caption="self-identified" delay={0.1} />
            <MetricCard title="Queries / Active User" value={data.kpis.avgQueriesPerActive} icon={Database} caption="engagement depth" delay={0.15} />
          </div>
          <div className="charts-grid">
            <CompositionPanel rows={data.composition} orgs={data.topOrgs} />
            <DepthPanel depth={data.depth} histogram={data.histogram} powerUsers={data.powerUsers} />
          </div>
        </>
      ) : (
        <div className="glass-panel chart-container">
          <div className="empty-state" style={{ margin: 'auto' }}>
            <span className="empty-icon"><Activity size={20} /></span>
            Retention &amp; Stickiness — available once Phase 2 ships.
          </div>
        </div>
      )}
    </div>
  );
}
