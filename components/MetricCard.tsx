'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({ title, value, icon: Icon, trend }: MetricCardProps) {
  return (
    <div className="metric-card glass-panel hover-lift fade-in">
      <div className="metric-header">
        <span>{title}</span>
        <Icon size={20} color="var(--accent-primary)" />
      </div>
      <div className="metric-value">{value}</div>
      {trend && (
        <div style={{ fontSize: '14px', color: trend.isPositive ? 'var(--success)' : '#ef4444' }}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last week
        </div>
      )}
    </div>
  );
}
