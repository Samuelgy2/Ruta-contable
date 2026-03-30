import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  className?: 'positive' | 'negative' | 'neutral';
}

export function StatCard({ title, value, description, className = 'neutral' }: StatCardProps) {
  return (
    <div className="stat-card">
      <h4>{title}</h4>
      <div className={`stat-value ${className}`}>{value}</div>
      {description && <p className="stat-description">{description}</p>}
    </div>
  );
}
