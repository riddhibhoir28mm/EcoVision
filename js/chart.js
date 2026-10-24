
/* =========================================================
   EcoVision — Neon 3D Air Pollution Chart
   Requires Chart.js to load before this file.
   Keeps window.updatePollutionChart(data) available.
   ========================================================= */

(() => {
    "use strict";

    const canvas = document.getElementById("pollutionChart");

    if (!canvas) {
        console.warn("EcoVision: pollutionChart canvas was not found.");
        return;
    }

    if (typeof Chart === "undefined") {
        console.error("EcoVision: Chart.js did not load.");
        return;
    }

    const ctx = canvas.getContext("2d");

    const pollutants = [
        { key: "pm25", label: "PM2.5", top: "#c5ffff", main: "#13e5ff", side: "#08718d" },
        { key: "pm10", label: "PM10", top: "#c8fff0", main: "#1dffd0", side: "#087e68" },
        { key: "no2",  label: "NO₂",  top: "#d7ffe2", main: "#63ff91", side: "#197844" },
        { key: "o3",   label: "O₃",   top: "#e8dcff", main: "#a98aff", side: "#5b3ea8" }
    ];

    let currentValues = [32, 48, 21, 64];
    let chartReady = false;

    // Draw a soft holographic background behind the bars.
    const holographicBackground = {
        id: "ecoHolographicBackground",

        beforeDraw(chart) {
            const area = chart.chartArea;
            if (!area) return;

            const c = chart.ctx;
            c.save();

            const glow = c.createRadialGradient(
                area.left + area.width * 0.5,
                area.top + area.height * 0.25,
                2,
                area.left + area.width * 0.5,
                area.top + area.height * 0.25,
                area.width * 0.75
            );

            glow.addColorStop(0, "rgba(0, 255, 220, 0.09)");
            glow.addColorStop(1, "rgba(0, 20, 30, 0)");

            c.fillStyle = glow;
            c.fillRect(
                area.left,
                area.top,
                area.width,
                area.height
            );

            c.restore();
        }
    };

    // Add a 3D-style side and top face to each bar.
    const holographicBars = {
        id: "ecoHolographicBars",

        afterDatasetsDraw(chart) {
            const meta = chart.getDatasetMeta(0);
            if (!meta || meta.hidden || !meta.data) return;

            const c = chart.ctx;

            c.save();

            meta.data.forEach((bar, index) => {
                const item = pollutants[index % pollutants.length];

                const x = bar.x;
                const y = bar.y;
                const base = bar.base;
                const width = bar.width;

                if (
                    !Number.isFinite(x) ||
                    !Number.isFinite(y) ||
                    !Number.isFinite(base) ||
                    base <= y + 2
                ) {
                    return;
                }

                const depth = Math.max(4, Math.min(10, width * 0.22));
                const left = x - width / 2;
                const right = x + width / 2;
                const topY = y - depth * 0.6;

                // Glow around the main bar.
                c.shadowColor = item.main;
                c.shadowBlur = 15;
                c.fillStyle = item.main;
                c.fillRect(left, y, width, base - y);
                c.shadowBlur = 0;

                // Repaint the front face with a vertical gradient.
                const front = c.createLinearGradient(left, y, right, base);
                front.addColorStop(0, item.top);
                front.addColorStop(0.18, item.main);
                front.addColorStop(1, item.side);

                c.fillStyle = front;
                c.fillRect(left, y, width, base - y);

                // Right-side 3D face.
                c.beginPath();
                c.moveTo(right, y);
                c.lineTo(right + depth, topY);
                c.lineTo(right + depth, base - depth * 0.6);
                c.lineTo(right, base);
                c.closePath();

                const side = c.createLinearGradient(
                    right,
                    y,
                    right + depth,
                    y
                );

                side.addColorStop(0, item.main);
                side.addColorStop(1, item.side);

                c.fillStyle = side;
                c.fill();

                c.strokeStyle = item.main;
                c.lineWidth = 1;
                c.stroke();

                // Top face.
                c.beginPath();
                c.moveTo(left, y);
                c.lineTo(left + depth, topY);
                c.lineTo(right + depth, topY);
                c.lineTo(right, y);
                c.closePath();

                const top = c.createLinearGradient(0, topY, 0, y);
                top.addColorStop(0, "#ffffff");
                top.addColorStop(0.4, item.top);
                top.addColorStop(1, item.main);

                c.fillStyle = top;
                c.shadowColor = item.main;
                c.shadowBlur = 12;
                c.fill();
                c.shadowBlur = 0;

                c.strokeStyle = item.top;
                c.stroke();

                // Bright front rim.
                c.beginPath();
                c.moveTo(left + 2, y + 1);
                c.lineTo(right - 2, y + 1);
                c.strokeStyle = "#ffffff";
                c.lineWidth = 1.5;
                c.shadowColor = item.main;
                c.shadowBlur = 8;
                c.stroke();
                c.shadowBlur = 0;
            });

            c.restore();
        }
    };

    function normalizeData(data) {
        // Accept either an array of values or an object of pollutant values.
        if (Array.isArray(data)) {
            return pollutants.map((item, index) => {
                const value = Number(data[index]);
                return Number.isFinite(value) && value >= 0 ? value : 0;
            });
        }

        if (!data || typeof data !== "object") {
            return null;
        }

        // Support common JSON structures such as:
        // { pm25: 32, pm10: 48, no2: 21, o3: 64 }
        // { pollutants: { PM2.5: 32, PM10: 48, NO2: 21, O3: 64 } }
        // { air: { pollutants: { PM2.5: 32, PM10: 48, NO2: 21, O3: 64 } } }
        const source =
            data.pollutants ||
            data.air?.pollutants ||
            data.air ||
            data;

        function readValue(key) {
            const aliases = {
                pm25: ["pm25", "PM2.5", "PM25", "pm2_5"],
                pm10: ["pm10", "PM10"],
                no2: ["no2", "NO2", "NO₂"],
                o3: ["o3", "O3", "O₃"]
            };

            for (const alias of aliases[key]) {
                const value = Number(source[alias]);
                if (
                    source[alias] !== undefined &&
                    source[alias] !== null &&
                    Number.isFinite(value) &&
                    value >= 0
                ) {
                    return value;
                }
            }

            return null;
        }

        const result = pollutants.map(item => readValue(item.key));

        if (result.every(value => value === null)) {
            return null;
        }

        return result.map((value, index) =>
            value === null ? currentValues[index] : value
        );
    }

    function makeGradients() {
        return pollutants.map(item => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, item.top);
            gradient.addColorStop(0.3, item.main);
            gradient.addColorStop(1, item.side);
            return gradient;
        });
    }

    function createChart() {
        if (chartReady) return;

        window.pollutionChart = new Chart(ctx, {
            type: "bar",

            data: {
                labels: pollutants.map(item => item.label),
                datasets: [{
                    label: "Pollutant concentration",
                    data: currentValues,
                    backgroundColor: makeGradients(),
                    borderColor: pollutants.map(item => item.top),
                    borderWidth: 1,
                    borderRadius: 5,
                    borderSkipped: false,
                    maxBarThickness: 42,
                    categoryPercentage: 0.66,
                    barPercentage: 0.78
                }]
            },

            plugins: [
                holographicBackground,
                holographicBars
            ],

            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 850,
                    easing: "easeOutQuart"
                },

                interaction: {
                    intersect: false,
                    mode: "index"
                },

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        backgroundColor: "rgba(3, 24, 30, 0.96)",
                        titleColor: "#b9fff5",
                        bodyColor: "#ffffff",
                        borderColor: "#13e5ff",
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true
                    }
                },

                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: "#d5fff7",
                            font: {
                                size: 12,
                                weight: "600"
                            }
                        },
                        border: {
                            color: "rgba(0, 255, 220, 0.35)"
                        }
                    },

                    y: {
                        beginAtZero: true,
                        grace: "15%",
                        ticks: {
                            color: "#a9dcd6",
                            precision: 0
                        },
                        grid: {
                            color: "rgba(100, 255, 225, 0.10)",
                            drawBorder: false
                        },
                        border: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: "Pollutant level",
                            color: "#9fffee"
                        }
                    }
                }
            }
        });

        chartReady = true;
    }

    // Keep the public function available for air.js and other scripts.
    window.updatePollutionChart = function (data) {
        const nextValues = normalizeData(data);

        if (!nextValues) {
            console.warn(
                "EcoVision: chart data format was not recognized.",
                data
            );
            return;
        }

        currentValues = nextValues;

        if (!chartReady) {
            createChart();
            return;
        }

        window.pollutionChart.data.datasets[0].data = currentValues;
        window.pollutionChart.data.datasets[0].backgroundColor =
            makeGradients();

        window.pollutionChart.update("none");
    };

    // Read the project's JSON data as the initial chart data.
    fetch("data/quality-data.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Could not load data/quality-data.json");
            }
            return response.json();
        })
        .then(json => {
            const air = json.air || json;
            const raw = air.pollutants || air;

            const initial = {
                pm25: raw.pm25 ?? raw["PM2.5"] ?? raw.PM25,
                pm10: raw.pm10 ?? raw.PM10,
                no2: raw.no2 ?? raw.NO2 ?? raw["NO₂"],
                o3: raw.o3 ?? raw.O3 ?? raw["O₃"]
            };

            const parsed = normalizeData(initial);
            if (parsed) currentValues = parsed;

            createChart();
        })
        .catch(error => {
            console.warn(
                "EcoVision: using fallback chart data.",
                error.message
            );
            createChart();
        });

    // Filter chart bars using the existing dropdown.
    const selector = document.getElementById("pollutantSelect");

    if (selector) {
        selector.addEventListener("change", () => {
            if (!chartReady) return;

            const chart = window.pollutionChart;
            const selected = selector.value;

            if (selected === "all") {
                chart.data.labels = pollutants.map(item => item.label);
                chart.data.datasets[0].data = currentValues;
                chart.data.datasets[0].backgroundColor = makeGradients();
                chart.data.datasets[0].borderColor =
                    pollutants.map(item => item.top);
            } else {
                const index = pollutants.findIndex(item => item.key === selected);

                if (index === -1) return;

                chart.data.labels = [pollutants[index].label];
                chart.data.datasets[0].data = [currentValues[index]];
                chart.data.datasets[0].backgroundColor = [makeGradients()[index]];
                chart.data.datasets[0].borderColor = [pollutants[index].top];
            }

            chart.update();
        });
    }
})();
