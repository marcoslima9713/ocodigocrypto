import { useMemo } from 'react';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function SparklineChart({ 
  data, 
  width = 100, 
  height = 40, 
  color = "#10b981",
  className = ""
}: SparklineChartProps) {
  const pathData = useMemo(() => {
    if (!data || data.length === 0) return '';

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });

    return points.join(' ');
  }, [data, width, height]);

  if (!data || data.length === 0) {
    return (
      <div 
        className={`bg-muted/20 rounded ${className}`}
        style={{ width, height }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-xs text-muted-foreground">N/A</span>
        </div>
      </div>
    );
  }

  return (
    <svg 
      width={width} 
      height={height} 
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={pathData}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
} 