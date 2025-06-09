import React from 'react';

interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
}

export default function Progress({ value, className = '' }: ProgressProps) {
  return (
    <div className={`w-full h-2 bg-gray-200 rounded ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-2 bg-blue-500 rounded transition-all duration-200"
        style={{ width: `${value}%` }}
      />
    </div>
  );
} 