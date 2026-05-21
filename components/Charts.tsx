'use client';

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import { TimeSeriesDataPoint, CategoryInsight, GeoInsight, FeatureAdoption, ThemePreference } from '../lib/types';

const COLORS = ['#06402B', '#4a6b5d', '#789c8a', '#a3bfae', '#D2DAD2', '#10b981'];

// Custom Tooltip component for better glassmorphism styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '12px' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color || 'var(--text-primary)', margin: '4px 0', fontWeight: 600 }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function TrendChart({ data }: { data: TimeSeriesDataPoint[] }) {
  return (
    <div className="glass-panel chart-container fade-in" style={{ animationDelay: '0.2s' }}>
      <h3 className="chart-title">Usage Trends (DAU, Queries, Visualizations)</h3>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06402B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06402B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
            <Area type="monotone" dataKey="queries" stroke="#06402B" strokeWidth={2} fillOpacity={1} fill="url(#colorQueries)" />
            <Area type="monotone" dataKey="dau" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDau)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CategoryChart({ data }: { data: CategoryInsight[] }) {
  return (
    <div className="glass-panel chart-container fade-in" style={{ animationDelay: '0.3s' }}>
      <h3 className="chart-title">Top Question Categories</h3>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
            <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} hide />
            <YAxis dataKey="category" type="category" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} width={120} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6,64,43,0.05)' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
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
  return (
    <div className="glass-panel chart-container fade-in" style={{ animationDelay: '0.4s' }}>
      <h3 className="chart-title">Geographic Distribution</h3>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={110}
              paddingAngle={5}
              dataKey="count"
              nameKey="country"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AdoptionChart({ data }: { data: FeatureAdoption[] }) {
  return (
    <div className="glass-panel chart-container fade-in" style={{ animationDelay: '0.5s' }}>
      <h3 className="chart-title">Feature Adoption Rate</h3>
      <div className="chart-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center', padding: '0 16px' }}>
        {data.map((item, index) => (
          <div key={index} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-primary)' }}>{item.feature}</span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{item.percentage}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${item.percentage}%`, 
                  height: '100%', 
                  background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index+1) % COLORS.length]})`,
                  borderRadius: '4px'
                }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
