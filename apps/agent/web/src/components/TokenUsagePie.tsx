import React from "react";

interface TokenUsagePieProps {
  used: number;
  total: number;
}

function TokenUsagePie({ used, total }: TokenUsagePieProps) {
  if (used == null || total == null || total <= 0) return null;

  const percentage = Math.min(100, (used / total) * 100);
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage < 50) return "#3b82f6"; // blue
    if (percentage < 75) return "#f59e0b"; // orange
    return "#ef4444"; // red
  };

  return (
    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
      <svg width="24" height="24" viewBox="0 0 24 24" className="transform -rotate-90">
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-300 dark:text-gray-600"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span title={`${used.toLocaleString()} / ${total.toLocaleString()} tokens`}>
        {percentage.toFixed(1)}%
      </span>
    </div>
  );
}

export default TokenUsagePie;
