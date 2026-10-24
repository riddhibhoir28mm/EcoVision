/* EcoVision water quality dashboard — full replacement */
(() => {
  "use strict";

  const canvas = document.getElementById("waterChart");
  const selector = document.getElementById("waterIndicator");
  const wqiNumber = document.querySelector(".aqi-number");
  const wqiStatus = document.querySelector(".aqi-status");
  const sourceLabel = document.getElementById("waterDataSource");
  const valueElements = {
    ph: document.getElementById("waterPh"),
    turbidity: document.getElementById("waterTurbidity"),
    oxygen: document.getElementById("waterOxygen"),
    tds: document.getElementById("waterTds")
  };

  if (!canvas) {
    console.error('EcoVision Water: canvas with id="waterChart" was not found in water-quality.html.');
    return;
  }

  const fallback = {
    wqi: 85,
    status: "Sample Data",
    indicators: { "pH": 7.2, "Turbidity": 25, "Dissolved Oxygen": 7.8, "TDS": 310 }
  };

  const labels = ["pH", "Turbidity", "Dissolved Oxygen", "TDS"];
  const keys = ["ph", "turbidity", "oxygen", "tds"];
  let chart = null;
  let waterValues = {};
  let usingSample = false;

  function numberOrFallback(value, fallbackValue) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : fallbackValue;
  }

  function normalizeWater(water) {
    const indicators = (water && water.indicators) || {};
    return {
      wqi: numberOrFallback(water && water.wqi, fallback.wqi),
      status: (water && water.status) || fallback.status,
      indicators: {
        "pH": numberOrFallback(indicators["pH"], fallback.indicators["pH"]),
        "Turbidity": numberOrFallback(indicators["Turbidity"], fallback.indicators["Turbidity"]),
        "Dissolved Oxygen": numberOrFallback(indicators["Dissolved Oxygen"], fallback.indicators["Dissolved Oxygen"]),
        "TDS": numberOrFallback(indicators["TDS"], fallback.indicators["TDS"])
      }
    };
  }

  function selectedChartData() {
    const selected = selector ? selector.value : "all";
    const values = [waterValues.ph, waterValues.turbidity, waterValues.oxygen, waterValues.tds];
    if (selected === "ph") return { labels: ["pH"], values: [values[0]] };
    if (selected === "turbidity") return { labels: ["Turbidity"], values: [values[1]] };
    if (selected === "oxygen") return { labels: ["Dissolved Oxygen"], values: [values[2]] };
    if (selected === "tds") return { labels: ["TDS"], values: [values[3]] };
    return { labels: labels.slice(), values };
  }

  function renderChart() {
    if (typeof Chart === "undefined") {
      console.error("EcoVision Water: Chart.js did not load. Check the Chart.js CDN script in water-quality.html.");
      if (sourceLabel) sourceLabel.textContent = "Chart library unavailable — check your internet connection.";
      return;
    }
    const data = selectedChartData();
    if (chart) {
      chart.data.labels = data.labels;
      chart.data.datasets[0].data = data.values;
      chart.options.scales.y.suggestedMax = Math.max(10, ...data.values) * 1.18;
      chart.update();
      return;
    }

    chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [{
          label: "Water indicator reading",
          data: data.values,
          backgroundColor: ["rgba(69,245,220,.78)", "rgba(62,191,255,.78)", "rgba(101,255,155,.78)", "rgba(177,135,255,.78)"],
          borderColor: ["#45f5dc", "#3ebfff", "#65ff9b", "#b187ff"],
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
        animation: { duration: 450 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#071719",
            titleColor: "#9efff0",
            bodyColor: "#eafff9",
            borderColor: "rgba(69,245,220,.4)",
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#c4ded8", font: { size: 11, weight: "600" } },
            border: { color: "rgba(69,245,220,.18)" }
          },
          y: {
            beginAtZero: true,
            suggestedMax: Math.max(10, ...data.values) * 1.18,
            grid: { color: "rgba(143,190,180,.12)" },
            ticks: { color: "#9bb9b3", precision: 2 },
            border: { display: false }
          }
        }
      }
    });
    window.waterQualityChart = chart;
  }

  function showWater(water) {
    const normalized = normalizeWater(water);
    if (wqiNumber) wqiNumber.textContent = normalized.wqi;
    if (wqiStatus) wqiStatus.textContent = String(normalized.status).toUpperCase();
    if (valueElements.ph) valueElements.ph.textContent = normalized.indicators["pH"];
    if (valueElements.turbidity) valueElements.turbidity.textContent = normalized.indicators["Turbidity"];
    if (valueElements.oxygen) valueElements.oxygen.textContent = normalized.indicators["Dissolved Oxygen"];
    if (valueElements.tds) valueElements.tds.textContent = normalized.indicators["TDS"];

    waterValues = {
      ph: normalized.indicators["pH"],
      turbidity: normalized.indicators["Turbidity"],
      oxygen: normalized.indicators["Dissolved Oxygen"],
      tds: normalized.indicators["TDS"]
    };
    if (sourceLabel) {
      sourceLabel.textContent = usingSample
        ? "DEMO VALUES • quality-data.json could not be loaded"
        : "VALUES LOADED FROM quality-data.json";
    }
    renderChart();
  }

  if (selector) selector.addEventListener("change", renderChart);

  fetch("data/quality-data.json")
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (!data || !data.water) throw new Error("The JSON file does not contain a water object.");
      usingSample = false;
      showWater(data.water);
    })
    .catch(error => {
      console.error("EcoVision Water: could not load water data; showing clearly labelled demo values.", error);
      usingSample = true;
      showWater(fallback);
    });
})();
