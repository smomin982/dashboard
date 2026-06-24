'use client';

import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, BarChart3, PieChart, TrendingUp, Settings, LifeBuoy,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  isLive?: boolean;
}

/** Each item maps to a section id rendered on the page (see app/page.tsx). */
const SECTIONS = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'trends', icon: BarChart3, label: 'Trends' },
  { id: 'insights', icon: PieChart, label: 'Insights' },
  { id: 'traction', icon: TrendingUp, label: 'Growth' },
];

const WORKSPACE = [
  { icon: Settings, label: 'Settings' },
  { icon: LifeBuoy, label: 'Support' },
];

const SECTION_IDS = SECTIONS.map((s) => s.id);

export function DashboardLayout({
  children,
  title = 'User Metrics',
  subtitle = 'Product engagement & adoption at a glance',
  isLive = false,
}: DashboardLayoutProps) {
  const [active, setActive] = useState<string>('overview');

  // Scroll-spy: highlight whichever section sits near the top of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -75% 0px', threshold: 0 },
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const goToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <LayoutDashboard color="white" size={22} />
          </div>
          <div className="brand-text">
            <h2>Copilot OS</h2>
            <span className="brand-sub">Policy Copilot</span>
          </div>
        </div>

        <div className="nav-group-label">Analytics</div>
        <nav className="nav" aria-label="Dashboard sections">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="nav-item"
              aria-current={active === item.id ? 'page' : undefined}
              onClick={() => goToSection(item.id)}
            >
              <item.icon size={19} strokeWidth={2} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="nav-group-label">Workspace</div>
        <nav className="nav" aria-label="Workspace">
          {WORKSPACE.map((item) => (
            <button
              key={item.label}
              type="button"
              className="nav-item"
              aria-disabled="true"
              disabled
              title="Coming soon"
            >
              <item.icon size={19} strokeWidth={2} />
              <span>{item.label}</span>
              <span className="nav-badge">Soon</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item" role="note" aria-label="Signed in account" style={{ cursor: 'default' }}>
            <span className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>PC</span>
            <span className="footer-text" style={{ fontSize: 'var(--text-sm)' }}>
              Policy Copilot
            </span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-inner">
          <div className="top-bar">
            <div>
              <h1 className="dashboard-title">{title}</h1>
              <p className="dashboard-subtitle">{subtitle}</p>
            </div>
            <div className="top-bar-actions">
              <span
                className={`status-pill ${isLive ? 'is-live' : 'is-offline'}`}
                role="status"
              >
                <span className="dot" />
                {isLive ? 'Live' : 'Offline'}
              </span>
              <span className="avatar" aria-hidden="true">PC</span>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
