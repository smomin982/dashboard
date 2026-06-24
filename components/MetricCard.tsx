'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  /** Small caption under the value, e.g. "all-time" or "last 7 days". */
  caption?: string;
  /** Highlighted hero card (filled green) for the headline metric. */
  variant?: 'default' | 'primary';
  /** Stagger entrance animation. */
  delay?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  caption,
  variant = 'default',
  delay = 0,
  trend,
}: MetricCardProps) {
  return (
    <div
      className={`metric-card glass-panel hover-lift fade-in${variant === 'primary' ? ' metric-card--primary' : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="metric-header">
        <span className="metric-label">{title}</span>
        <span className="metric-icon" aria-hidden="true">
          <Icon size={18} strokeWidth={2} />
        </span>
      </div>

      <div className="metric-value">{value}</div>

      {(trend || caption) && (
        <div className="metric-foot">
          {trend && (
            <span className={`metric-trend ${trend.isPositive ? 'is-up' : 'is-down'}`}>
              {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend.value)}%
            </span>
          )}
          {caption && <span>{caption}</span>}
        </div>
      )}
    </div>
  );
}
