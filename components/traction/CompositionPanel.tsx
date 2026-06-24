'use client';
import React from 'react';
import { CompositionRow, OrgRow } from '../../lib/tractionTypes';

const COLORS = ['#06402B', '#2f7d5b', '#5fa886', '#8ec4ab', '#b6d9c8', '#cfe6da'];

export function CompositionPanel({ rows, orgs }: { rows: CompositionRow[]; orgs: OrgRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="glass-panel chart-container is-auto fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="chart-head">
        <div>
          <h3 className="chart-title">Who&apos;s using it</h3>
          <p className="chart-subtitle">Real users grouped by email domain</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: '4px 4px 0' }}>
        {rows.map((r, i) => (
          <div key={r.bucket}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: '5px' }}>
              <span>{r.bucket}</span><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{r.count}</span>
            </div>
            <div style={{ height: '10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
              <div style={{ width: `${(r.count / max) * 100}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: 'var(--radius-pill)', transition: 'width 0.8s var(--ease-out)' }} />
            </div>
          </div>
        ))}
        {rows.length === 0 && <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No user data</span>}
      </div>
      {orgs.length > 0 && (
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>
          {orgs.reduce((a, o) => a + o.n, 0)} self-identified an organization · {orgs.slice(0, 4).map((o) => o.organization).join(', ')}
        </p>
      )}
    </div>
  );
}
