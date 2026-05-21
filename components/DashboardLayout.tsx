'use client';

import React from 'react';
import { LayoutDashboard, Users, MessageSquare, PieChart, Settings } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LayoutDashboard color="white" size={24} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Copilot OS</h2>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { icon: LayoutDashboard, label: 'Overview', active: true },
            { icon: Users, label: 'Users' },
            { icon: MessageSquare, label: 'Conversations' },
            { icon: PieChart, label: 'Insights' },
            { icon: Settings, label: 'Settings' }
          ].map((item, index) => (
            <div 
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: item.active ? 'rgba(6, 64, 43, 0.1)' : 'transparent',
                color: item.active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                transition: 'all 0.2s',
                fontWeight: item.active ? 600 : 500
              }}
              onMouseEnter={(e) => {
                if (!item.active) e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                if (!item.active) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>
      
      <main className="main-content">
        <div className="top-bar">
          <h1 className="dashboard-title">User Metrics</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--bg-glass)', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', border: 'var(--glass-border)' }}>
              Live Mode: <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>●</span> Active
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px solid var(--accent-secondary)' }} />
          </div>
        </div>
        
        {children}
      </main>
    </div>
  );
}
