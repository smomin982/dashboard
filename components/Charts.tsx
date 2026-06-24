'use client';

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie,
} from 'recharts';
import { TimeSeriesDataPoint, CategoryInsight, GeoInsight, FeatureAdoption } from '../lib/types';

const COLORS = ['#06402B', '#2f7d5b', '#4a6b5d', '#5fa886', '#8ec4ab', '#10b981'];

/* Shared card header so every chart has the same title/subtitle rhythm. */
function ChartHead({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: string }) {
  return (
    <div className="chart-head">
      <div>
        <h3 className="chart-title">{title}</h3>
        {subtitle && <p className="chart-subtitle">{subtitle}</p>}
      </div>
      {badge && <span className="pill">{badge}</span>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-glass-strong)',
          backdropFilter: 'blur(8px)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {label && (
          <p style={{ margin: '0 0 6px', color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {label}
          </p>
        )}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '3px 0', fontSize: '13px', color: 'var(--text-primary)' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, display: 'inline-block' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const axisProps = {
  stroke: 'var(--text-tertiary)',
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

export function TrendChart({ data }: { data: TimeSeriesDataPoint[] }) {
  return (
    <div className="glass-panel chart-container fade-in" style={{ animationDelay: '0.2s' }}>
      <ChartHead title="Usage Trends" subtitle="Daily active users, queries & visualizations" />
      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%" minHeight={240} initialDimension={{ width: 600, height: 300 }}>
          <AreaChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06402B" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#06402B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorViz" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5fa886" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#5fa886" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="date" {...axisProps} dy={6} />
            <YAxis {...axisProps} width={36} />
            <Tooltip content={<CustomTooltip />} isAnimationActive={false} wrapperStyle={{ zIndex: 50, outline: 'none' }} />
            <Legend verticalAlign="top" align="right" height={32} iconType="circle" iconSize={9} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
            <Area type="monotone" dataKey="queries" name="Queries" stroke="#06402B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorQueries)" />
            <Area type="monotone" dataKey="dau" name="Active Users" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDau)" />
            <Area type="monotone" dataKey="visualizations" name="Visualizations" stroke="#5fa886" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViz)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CategoryChart({ data }: { data: CategoryInsight[] }) {
  return (
    <div className="glass-panel chart-container fade-in" style={{ animationDelay: '0.3s' }}>
      <ChartHead title="Top Question Categories" subtitle="Most-requested indicator topics" />
      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%" minHeight={240} initialDimension={{ width: 500, height: 300 }}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
            <XAxis type="number" {...axisProps} hide />
            <YAxis dataKey="category" type="category" {...axisProps} width={130} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent-soft)' }} isAnimationActive={false} wrapperStyle={{ zIndex: 50, outline: 'none' }} />
            <Bar dataKey="count" name="Questions" radius={[0, 6, 6, 0]} barSize={18}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function GeoChart({ data }: { data: GeoInsight[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <div className="glass-panel chart-container fade-in" style={{ animationDelay: '0.4s' }}>
      <ChartHead title="Research Focus by Country" subtitle="Share of projects by geography" />
      <div className="chart-body" style={{ position: 'relative' }}>
        {/* Donut centre total */}
        <div
          style={{
            position: 'absolute', top: '38%', left: 0, right: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            pointerEvents: 'none', transform: 'translateY(-50%)',
          }}
        >
          <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {total.toLocaleString()}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Projects
          </span>
        </div>
        <ResponsiveContainer width="100%" height="100%" minHeight={240} initialDimension={{ width: 500, height: 300 }}>
          <PieChart>
            <Pie data={data} cx="50%" cy="42%" innerRadius={74} outerRadius={104} paddingAngle={3} dataKey="count" nameKey="country" stroke="none">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} isAnimationActive={false} wrapperStyle={{ zIndex: 50, outline: 'none' }} />
            <Legend verticalAlign="bottom" height={32} iconType="circle" iconSize={9} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AdoptionChart({ data }: { data: FeatureAdoption[] }) {
  return (
    <div className="glass-panel chart-container fade-in" style={{ animationDelay: '0.5s' }}>
      <ChartHead title="Feature Adoption" subtitle="Share of users who used each feature" badge="all-time" />
      <div className="chart-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', justifyContent: 'center', padding: '0 4px' }}>
        {data.map((item, index) => (
          <div key={index} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', fontSize: 'var(--text-base)' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.feature}</span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {item.percentage}%
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 500, fontSize: '11px', marginLeft: 6 }}>
                  {item.adoptedUsers}/{item.totalUsers}
                </span>
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={item.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${item.feature} adoption`}
              style={{ width: '100%', height: '10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}
            >
              <div
                style={{
                  width: `${item.percentage}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                  borderRadius: 'var(--radius-pill)',
                  transition: 'width 0.8s var(--ease-out)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
