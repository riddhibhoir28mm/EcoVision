/* EcoVision air pollutant chart — full replacement */
(() => {
  "use strict";

  const canvas = document.getElementById("pollutionChart");
  const select = document.getElementById("pollutantSelect");
  if (!canvas) return;

  const labels = ["PM2.5", "PM10", "NO₂", "O₃"];
  const keys = ["PM2.5", "PM10", "NO2", "O3"];
  let chart = null;
  let baseValues = [80, 48, 21, 64]; // only used if the JSON file cannot be loaded
  let liveValues = null;

  function chartValues() {
    return liveValues || baseValues;
  }

  function selectedData() {
    const values = chartValues();
    const selected = select ? select.value : "all";
    const indexBySelection = { pm25: 0, pm10: 1, no2: 2, o3: 3 };
    if (selected === "all" || !(selected in indexBySelection)) {
      return { labels: labels.slice(), values: values.slice() };
    }
    const index = indexBySelection[selected];
    return { labels: [labels[index]], values: [values[index]] };
  }

  function renderChart() {
    if (typeof Chart === "undefined") {
      console.error("EcoVision: Chart.js did not load. Check your internet connection.");
      return;
    }
    const data = selectedData();
    if (chart) {
      chart.data.labels = data.labels;
      chart.data.datasets[0].data = data.values;
      chart.update();
      return;
    }
    chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [{
          label: "Pollutant concentration (µg/m³)",
          data: data.values,
          backgroundColor: [
            "rgba(69,245,220,.78)",
            "rgba(101,255,155,.78)",
            "rgba(62,191,255,.78)",
            "rgba(177,135,255,.78)"
          ],
          borderColor: ["#45f5dc", "#65ff9b", "#3ebfff", "#b187ff"],
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 48,
          categoryPercentage: .62,
          barPercentage: .78
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#071719",
            titleColor: "#9efff0",
            bodyColor: "#eafff9",
            borderColor: "rgba(69,245,220,.4)",
            borderWidth: 1,
            callbacks: {
              label: context => ` ${context.parsed.y} µg/m³`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#c4ded8", font: { size: 12, weight: "600" } },
            border: { color: "rgba(69,245,220,.18)" }
          },
          y: {
            beginAtZero: true,
            suggestedMax: Math.max(100, ...chartValues()) * 1.15,
            grid: { color: "rgba(143,190,180,.12)" },
            ticks: { color: "#9bb9b3", precision: 0 },
            border: { display: false }
          }
        }
      }
    });
    window.pollutionChart = chart;
  }

  function applyLiveValues(values) {
    if (!Array.isArray(values) || values.length !== 4) return;
    liveValues = values.map(value => {
      const number = Number(value);
      return Number.isFinite(number) && number >= 0 ? number : 0;
    });
    renderChart();
  }

  window.updateEcoVisionAirChart = applyLiveValues;

  if (select) select.addEventListener("change", renderChart);

  fetch("data/quality-data.json")
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      const pollutants = data && data.air && data.air.pollutants;
      if (pollutants) {
        baseValues = keys.map(key => {
          const number = Number(pollutants[key]);
          return Number.isFinite(number) && number >= 0 ? number : 0;
        });
      }
      renderChart();
    })
    .catch(error => {
      console.warn("EcoVision: using clearly labelled starter chart values because air data could not load.", error);
      renderChart();
    });

  // If live-aqi.js fetches after this chart loads, its values can update the chart.
  window.addEventListener("ecovision:live-air", event => {
    if (event.detail && Array.isArray(event.detail.values)) applyLiveValues(event.detail.values);
  });
})();
