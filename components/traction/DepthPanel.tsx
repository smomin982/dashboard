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
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-primary)' }}>{v}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>{l}</div>
    </div>
  );

  return (
    <div className="glass-panel chart-container fade-in" style={{ animationDelay: '0.3s' }}>
      <h3 className="chart-title">Depth of use</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {tile(String(depth.msgsPerConv), 'Messages per conversation')}
        {tile(`${depth.pctMultiConv}%`, 'Users with 2+ conversations')}
        {tile(String(depth.savedPerActive), 'Saved insights / active user')}
        {tile(String(depth.vizCount), 'Visualizations generated')}
      </div>
      <h3 className="chart-title" style={{ fontSize: '12px', margin: '16px 0 6px' }}>Conversations per user</h3>
      <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-end', height: '54px' }}>
        {histVals.map((v, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: `${(v / histMax) * 44}px`, background: '#10b981', borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
            <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{HIST_ORDER[i]}</span>
          </div>
        ))}
      </div>
      {powerUsers.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <h3 className="chart-title" style={{ fontSize: '12px', margin: '0 0 6px' }}>Power users</h3>
          {powerUsers.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', padding: '3px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span>User from {p.bucket}</span>
              <span>{p.conversations} conv · {p.queries} queries</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
