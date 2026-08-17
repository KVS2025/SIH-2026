/**
 * AYUSH CodeBridge - System Health & Monitoring Charts
 * Powered by Chart.js
 */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof Chart !== "undefined") {
    initHealthCharts();
  }
});

function initHealthCharts() {
  const trafficCanvas = document.getElementById("chart-api-traffic");
  const volumeCanvas = document.getElementById("chart-search-volume");
  const distCanvas = document.getElementById("chart-translation-dist");

  // 1. API Traffic & Latency Chart
  if (trafficCanvas) {
    new Chart(trafficCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
        datasets: [
          {
            label: "API Requests / hr",
            data: [1200, 950, 3400, 5800, 6200, 4900, 5120],
            borderColor: "#16805A",
            backgroundColor: "rgba(22, 128, 90, 0.1)",
            fill: true,
            tension: 0.35
          },
          {
            label: "Response Latency (ms)",
            data: [24, 22, 35, 42, 38, 28, 26],
            borderColor: "#155EEF",
            backgroundColor: "transparent",
            borderDash: [5, 5],
            tension: 0.35,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" } },
          y1: { position: "right", beginAtZero: true, grid: { drawOnChartArea: false } }
        }
      }
    });
  }

  // 2. Search Volume by Terminology Bar Chart
  if (volumeCanvas) {
    new Chart(volumeCanvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["NAMASTE", "WHO TM2", "ICD-11 Biomedical", "ABDM Interop"],
        datasets: [
          {
            label: "Searches (Past 24h)",
            data: [14200, 11800, 8900, 6400],
            backgroundColor: ["#14532D", "#0F766E", "#155EEF", "#C99A2E"],
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  // 3. Translation Request Distribution Doughnut Chart
  if (distCanvas) {
    new Chart(distCanvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Exact Match", "Broader/Narrower", "Related Match", "No Direct Equivalent"],
        datasets: [
          {
            data: [68, 18, 11, 3],
            backgroundColor: ["#16A34A", "#0F766E", "#155EEF", "#DC2626"]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }
}
