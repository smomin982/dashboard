'use client';

import React from 'react';

interface FilterProps {
  days: string;
  setDays: (val: string) => void;
  region: string;
  setRegion: (val: string) => void;
}

export function FilterControls({ days, setDays, region, setRegion }: FilterProps) {
  return (
    <div className="filters-bar fade-in" style={{ animationDelay: '0.1s' }}>
      <select className="filter-select" value={days} onChange={e => setDays(e.target.value)}>
        <option value="7">Last 7 Days</option>
        <option value="30">Last 30 Days</option>
        <option value="90">Last 90 Days</option>
        <option value="all">All Time</option>
      </select>
      
      <select className="filter-select" value={region} onChange={e => setRegion(e.target.value)}>
        <option value="all">All Regions</option>
        <option value="North America">North America</option>
        <option value="Europe">Europe</option>
        <option value="Asia Pacific">Asia Pacific</option>
        <option value="Africa">Africa</option>
      </select>
    </div>
  );
}
