'use client';
import React from 'react';
import { DepthMetrics, HistRow, PowerUser } from '../../lib/tractionTypes';

const HIST_ORDER = ['1', '2', '3', '4', '5', '6+'];

export function DepthPanel({ depth, histogram, powerUsers }:
  { depth: DepthMetrics; histogram: HistRow[]; powerUsers: PowerUser[] }) {
  const histMap = new Map(histogram.map((h) => [h.bucket, h.n]));
  const histVals = HIST_ORDER.map((b) => histMap.get(b) ?? 0);
  const histMax = Math.max(1, ...histVals);

  const tile = (v: string, l: string) => (
    <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--accent-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{v}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.3 }}>{l}</div>
    </div>
  );

  return (
    <div className="glass-panel chart-container is-auto fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="chart-head">
        <div>
          <h3 className="chart-title">Depth of use</h3>
          <p className="chart-subtitle">How much each user engages</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        {tile(String(depth.msgsPerConv), 'Messages per conversation')}
        {tile(`${depth.pctMultiConv}%`, 'Users with 2+ conversations')}
        {tile(String(depth.savedPerActive), 'Saved insights / active user')}
        {tile(String(depth.vizCount), 'Visualizations generated')}
      </div>

      <p className="panel-subhead">Conversations per user</p>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '72px' }}>
        {histVals.map((v, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
            <div
              title={`${v} user${v === 1 ? '' : 's'}`}
              style={{
                width: '100%',
                height: `${v > 0 ? Math.max((v / histMax) * 100, 6) : 0}%`,
                minHeight: v > 0 ? '4px' : '0',
                background: 'linear-gradient(180deg, var(--green-400), var(--green-600))',
                borderRadius: '4px 4px 0 0',
              }}
            />
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{HIST_ORDER[i]}</span>
          </div>
        ))}
      </div>

      {powerUsers.length > 0 && (
        <div>
          <p className="panel-subhead">Power users</p>
          {powerUsers.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>User from {p.bucket}</span>
              <span style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{p.conversations} conv · {p.queries} queries</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
