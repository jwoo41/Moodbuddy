import { useEffect, useRef } from "react";
import { SleepEntry } from "@shared/schema";

interface SleepChartProps {
  sleepEntries: SleepEntry[];
}

export default function SleepChart({ sleepEntries }: SleepChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || !sleepEntries.length) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Prepare data for the last 7 days
    const last7Days = sleepEntries.slice(0, 7).reverse();
    const labels = last7Days.map((entry) => {
      const date = new Date(entry.createdAt);
      return date.toLocaleDateString("en-US", { weekday: "short" });
    });
    const hours = last7Days.map((entry) => entry.hoursSlept);

    // @ts-ignore - Chart.js is loaded via CDN
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Hours of Sleep",
            data: hours,
            borderColor: "hsl(213, 85%, 60%)",
            backgroundColor: "hsla(213, 85%, 60%, 0.1)",
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
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 12,
            grid: {
              color: "hsl(217, 12%, 89%)",
            },
            ticks: {
              color: "hsl(210, 7%, 42%)",
            },
          },
          x: {
            grid: {
              color: "hsl(217, 12%, 89%)",
            },
            ticks: {
              color: "hsl(210, 7%, 42%)",
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [sleepEntries]);

  if (!sleepEntries.length) {
    return (
      <div className="h-48 bg-mindflow-neutral-50 dark:bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl text-mindflow-neutral-300 dark:text-muted-foreground mb-2">📊</div>
          <p className="text-sm text-mindflow-neutral-500 dark:text-muted-foreground">
            No sleep data yet
          </p>
          <p className="text-xs text-mindflow-neutral-400 dark:text-muted-foreground">
            Add your first sleep entry to see patterns
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-48 relative">
      <canvas ref={chartRef} data-testid="sleep-chart" />
    </div>
  );
}
