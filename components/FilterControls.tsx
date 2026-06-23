'use client';

import React from 'react';

interface FilterProps {
  days: string;
  setDays: (val: string) => void;
}

// Note: the region dropdown was removed. None of the core tables (conversations,
// messages, usage_analytics) carry a region, so the old control silently did
// nothing. Re-add it only once region can actually be derived (e.g. via a
// projects join) and the API can filter on it.
export function FilterControls({ days, setDays }: FilterProps) {
  return (
    <div className="filters-bar fade-in" style={{ animationDelay: '0.1s' }}>
      <select className="filter-select" value={days} onChange={e => setDays(e.target.value)}>
        <option value="7">Last 7 Days</option>
        <option value="30">Last 30 Days</option>
        <option value="90">Last 90 Days</option>
        <option value="all">All Time</option>
      </select>
    </div>
  );
}
