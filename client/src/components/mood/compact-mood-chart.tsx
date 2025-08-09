import { useEffect, useRef } from "react";
import { MoodEntry } from "@shared/schema";

interface CompactMoodChartProps {
  moodEntries: MoodEntry[];
}

// Convert mood string to numerical value for charting
const moodToValue = (mood: string): number => {
  switch (mood) {
    case "very-sad": return 1;
    case "sad": return 2;
    case "neutral": return 3;
    case "happy": return 4;
    case "very-happy": return 5;
    default: return 3;
  }
};

export default function CompactMoodChart({ moodEntries }: CompactMoodChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || !moodEntries.length) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Prepare data for the last 7 days
    const last7Days = moodEntries.slice(0, 7).reverse();
    const labels = last7Days.map((entry) => {
      const date = new Date(entry.createdAt);
      return date.toLocaleDateString("en-US", { weekday: "short" });
    });
    const moodValues = last7Days.map((entry) => moodToValue(entry.mood));

    // Create a subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 150);
    gradient.addColorStop(0, "rgba(139, 69, 197, 0.15)");
    gradient.addColorStop(1, "rgba(196, 181, 253, 0.05)");

    // @ts-ignore - Chart.js is loaded via CDN
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Mood",
            data: moodValues,
            borderColor: "rgba(139, 69, 197, 0.8)",
            backgroundColor: gradient,
            borderWidth: 2,
            pointBackgroundColor: "rgba(139, 69, 197, 0.9)",
            pointBorderColor: "rgba(139, 69, 197, 1)",
            pointBorderWidth: 1,
            pointRadius: 3,
            pointHoverRadius: 5,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false, // Disable tooltips for compact chart
          },
        },
        scales: {
          y: {
            display: false,
            min: 0.5,
            max: 5.5,
          },
          x: {
            display: true,
            grid: {
              display: false,
            },
            ticks: {
              color: "rgb(107, 114, 128)",
              font: {
                size: 10,
              },
            },
            border: {
              display: false,
            },
          },
        },
        elements: {
          line: {
            borderJoinStyle: 'round' as const,
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [moodEntries]);

  if (!moodEntries.length) {
    return (
      <div className="h-32 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-1">📈</div>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            Start tracking mood to see trends
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={chartRef}
        className="w-full h-32"
        style={{ background: "transparent" }}
      />
    </div>
  );
}