import { useEffect, useRef } from "react";
import { MoodEntry } from "@shared/schema";

interface MoodChartProps {
  moodEntries: MoodEntry[];
}

// Soothing color gradients for different moods
const moodColorScheme = {
  "very-sad": {
    primary: "rgb(244, 63, 94)", // rose-500
    light: "rgba(244, 63, 94, 0.1)",
    gradient: ["rgba(244, 63, 94, 0.8)", "rgba(251, 113, 133, 0.4)", "rgba(254, 205, 211, 0.2)"]
  },
  "sad": {
    primary: "rgb(249, 115, 22)", // orange-500
    light: "rgba(249, 115, 22, 0.1)",
    gradient: ["rgba(249, 115, 22, 0.8)", "rgba(251, 146, 60, 0.4)", "rgba(254, 215, 170, 0.2)"]
  },
  "neutral": {
    primary: "rgb(107, 114, 128)", // gray-500
    light: "rgba(107, 114, 128, 0.1)",
    gradient: ["rgba(107, 114, 128, 0.8)", "rgba(156, 163, 175, 0.4)", "rgba(229, 231, 235, 0.2)"]
  },
  "happy": {
    primary: "rgb(34, 197, 94)", // green-500
    light: "rgba(34, 197, 94, 0.1)",
    gradient: ["rgba(34, 197, 94, 0.8)", "rgba(74, 222, 128, 0.4)", "rgba(187, 247, 208, 0.2)"]
  },
  "very-happy": {
    primary: "rgb(59, 130, 246)", // blue-500
    light: "rgba(59, 130, 246, 0.1)",
    gradient: ["rgba(59, 130, 246, 0.8)", "rgba(96, 165, 250, 0.4)", "rgba(191, 219, 254, 0.2)"]
  }
};

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

// Convert numerical value back to mood string
const valueToMood = (value: number): keyof typeof moodColorScheme => {
  if (value <= 1.5) return "very-sad";
  if (value <= 2.5) return "sad";
  if (value <= 3.5) return "neutral";
  if (value <= 4.5) return "happy";
  return "very-happy";
};

export default function MoodChart({ moodEntries }: MoodChartProps) {
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

    // Prepare data for the last 14 days
    const last14Days = moodEntries.slice(0, 14).reverse();
    const labels = last14Days.map((entry) => {
      const date = new Date(entry.createdAt);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });
    const moodValues = last14Days.map((entry) => moodToValue(entry.mood));

    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(139, 69, 197, 0.3)"); // purple-600 with transparency
    gradient.addColorStop(0.5, "rgba(168, 85, 247, 0.2)"); // purple-500 with transparency  
    gradient.addColorStop(1, "rgba(196, 181, 253, 0.1)"); // purple-300 with transparency

    // Create dynamic point colors based on mood values
    const pointColors = moodValues.map(value => {
      const mood = valueToMood(value);
      return moodColorScheme[mood].primary;
    });

    // Create dynamic point hover colors
    const pointHoverColors = moodValues.map(value => {
      const mood = valueToMood(value);
      return moodColorScheme[mood].primary;
    });

    // @ts-ignore - Chart.js is loaded via CDN
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Mood Trend",
            data: moodValues,
            borderColor: "rgba(139, 69, 197, 0.8)", // purple-600
            backgroundColor: gradient,
            borderWidth: 3,
            pointBackgroundColor: pointColors,
            pointBorderColor: pointHoverColors,
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(17, 24, 39, 0.9)", // gray-900
            titleColor: "rgb(243, 244, 246)", // gray-100
            bodyColor: "rgb(209, 213, 219)", // gray-300
            borderColor: "rgba(139, 69, 197, 0.5)",
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: function(context: any) {
                const moodNames = ["", "Very Sad 😢", "Sad 😞", "Neutral 😐", "Happy 😊", "Very Happy 😄"];
                return `Mood: ${moodNames[Math.round(context.raw)]}`;
              }
            }
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 0.5,
            max: 5.5,
            grid: {
              color: "rgba(229, 231, 235, 0.3)", // gray-200 with transparency
              drawBorder: false,
            },
            ticks: {
              color: "rgb(107, 114, 128)", // gray-500
              stepSize: 1,
              callback: function(value: any) {
                const moodLabels = ["", "😢", "😞", "😐", "😊", "😄"];
                return moodLabels[Math.round(value)] || "";
              }
            },
            border: {
              display: false,
            },
          },
          x: {
            grid: {
              color: "rgba(229, 231, 235, 0.3)", // gray-200 with transparency
              drawBorder: false,
            },
            ticks: {
              color: "rgb(107, 114, 128)", // gray-500
              maxTicksLimit: 7, // Limit number of labels for better readability
            },
            border: {
              display: false,
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
  }, [moodEntries]);

  if (!moodEntries.length) {
    return (
      <div className="h-64 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg flex items-center justify-center border border-purple-200 dark:border-purple-700">
        <div className="text-center p-6">
          <div className="text-4xl mb-3">📈</div>
          <p className="text-purple-600 dark:text-purple-400 font-medium mb-2">
            Your Mood Journey Awaits
          </p>
          <p className="text-sm text-purple-500 dark:text-purple-300">
            Start tracking your mood to see beautiful trends and patterns over time
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={chartRef}
        className="w-full h-64"
        style={{ background: "transparent" }}
      />
      {/* Mood reference legend */}
      <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <span>Very Sad</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-orange-400"></div>
          <span>Sad</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
          <span>Neutral</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span>Happy</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
          <span>Very Happy</span>
        </div>
      </div>
    </div>
  );
}