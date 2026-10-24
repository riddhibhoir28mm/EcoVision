
/* =====================================================
   EcoVision — Water Quality Dashboard
   Compact neon chart + water indicator cards
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const canvas = document.getElementById("waterChart");
    const indicatorSelect = document.getElementById("waterIndicator");

    if (typeof Chart === "undefined") {
        console.error("EcoVision: Chart.js did not load.");
        return;
    }

    if (!canvas) {
        console.error("EcoVision: canvas #waterChart was not found.");
        return;
    }

    // Keep the graph compact, regardless of older CSS rules.
    const chartBox = canvas.parentElement;

    if (chartBox) {
        chartBox.style.position = "relative";
        chartBox.style.width = "100%";
        chartBox.style.height =
            window.innerWidth <= 600 ? "235px" : "280px";
        chartBox.style.maxHeight =
            window.innerWidth <= 600 ? "235px" : "280px";
    }

    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";

    const wqiNumber = document.querySelector(
        ".aqi-main-card .aqi-number"
    );

    const wqiStatus = document.querySelector(
        ".aqi-main-card .aqi-status"
    );

    const sourceNote = document.getElementById("waterDataSource");

    const indicatorInfo = {
        ph: {
            label: "pH",
            key: "pH",
            unit: "",
            color: "#38e8ff",
            dark: "#087eaa"
        },
        turbidity: {
            label: "Turbidity",
            key: "Turbidity",
            unit: " NTU",
            color: "#41ffc7",
            dark: "#07876c"
        },
        oxygen: {
            label: "Dissolved Oxygen",
            key: "Dissolved Oxygen",
            unit: " mg/L",
            color: "#a995ff",
            dark: "#6046c4"
        },
        tds: {
            label: "TDS",
            key: "TDS",
            unit: " mg/L",
            color: "#7dff8a",
            dark: "#238b54"
        }
    };

    // Fallback values are illustrative, not live measurements.
    const sampleWater = {
        wqi: 85,
        status: "Sample Data",
        indicators: {
            "pH": 7.2,
            "Turbidity": 25,
            "Dissolved Oxygen": 7.8,
            "TDS": 310
        }
    };

    let currentWater = null;
    let waterChart = null;

    // ================================================
    // UPDATE WATER DASHBOARD CARDS
    // ================================================

    function updateWaterValues(water) {
        const indicators = water.indicators || {};

        const cards = [
            ["waterPh", "pH"],
            ["waterTurbidity", "Turbidity"],
            ["waterOxygen", "Dissolved Oxygen"],
            ["waterTds", "TDS"]
        ];

        cards.forEach(([id, key]) => {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = indicators[key] ?? "--";
            }
        });

        if (wqiNumber) {
            wqiNumber.textContent = water.wqi ?? "--";
        }

        if (wqiStatus) {
            wqiStatus.textContent = water.status ?? "Unavailable";
        }

        if (sourceNote) {
            sourceNote.textContent =
                water.isFallback
                    ? "Illustrative sample values — not live water measurements."
                    : "Values loaded from data/quality-data.json — not live water measurements.";
        }
    }

    // ================================================
    // NEON CHART BACKGROUND
    // ================================================

    const glowPlugin = {
        id: "ecoWaterGlow",

        beforeDraw(chart) {
            const area = chart.chartArea;
            if (!area) return;

            const ctx = chart.ctx;
            ctx.save();

            const glow = ctx.createRadialGradient(
                area.left + area.width / 2,
                area.top + area.height * 0.45,
                2,
                area.left + area.width / 2,
                area.top + area.height * 0.45,
                area.width * 0.75
            );

            glow.addColorStop(0, "rgba(0, 235, 220, 0.10)");
            glow.addColorStop(1, "rgba(0, 30, 40, 0)");

            ctx.fillStyle = glow;
            ctx.fillRect(
                area.left,
                area.top,
                area.width,
                area.height
            );

            ctx.restore();
        }
    };

    // ================================================
    // CREATE / UPDATE WATER CHART
    // ================================================

    function createWaterChart() {
        if (!currentWater || !currentWater.indicators) return;

        const indicators = currentWater.indicators;
        const selected = indicatorSelect
            ? indicatorSelect.value
            : "all";

        let items = Object.values(indicatorInfo);

        if (selected !== "all" && indicatorInfo[selected]) {
            items = [indicatorInfo[selected]];
        }

        const labels = items.map(item => item.label);
        const values = items.map(item => {
            const value = Number(indicators[item.key]);
            return Number.isFinite(value) ? value : 0;
        });

        const colors = items.map(item => item.color);
        const darkColors = items.map(item => item.dark);

        const ctx = canvas.getContext("2d");

        const gradients = items.map(item => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 280);
            gradient.addColorStop(0, "#ffffff");
            gradient.addColorStop(0.12, item.color);
            gradient.addColorStop(1, item.dark);
            return gradient;
        });

        if (waterChart) {
            waterChart.destroy();
        }

        waterChart = new Chart(ctx, {
            type: "bar",

            data: {
                labels,

                datasets: [{
                    label: "Indicator value",
                    data: values,
                    backgroundColor: gradients,
                    borderColor: colors,
                    borderWidth: 1.5,
                    borderRadius: 7,
                    borderSkipped: false,
                    maxBarThickness: 48,
                    categoryPercentage: 0.68,
                    barPercentage: 0.78
                }]
            },

            plugins: [glowPlugin],

            options: {
                responsive: true,
                maintainAspectRatio: false,

                animation: {
                    duration: 700,
                    easing: "easeOutQuart"
                },

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        backgroundColor: "rgba(3, 24, 35, 0.96)",
                        titleColor: "#9fffee",
                        bodyColor: "#ffffff",
                        borderColor: "#24e9d0",
                        borderWidth: 1,
                        padding: 11,

                        callbacks: {
                            label(context) {
                                const item = items[context.dataIndex];
                                return `${context.parsed.y}${item.unit}`;
                            }
                        }
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
                                size: 11,
                                weight: "600"
                            },
                            maxRotation: 0,
                            minRotation: 0
                        },

                        border: {
                            color: "rgba(0, 255, 220, 0.35)"
                        }
                    },

                    y: {
                        beginAtZero: true,

                        ticks: {
                            color: "#a9dcd6",
                            precision: 2,
                            maxTicksLimit: 6
                        },

                        grid: {
                            color: "rgba(100, 255, 225, 0.11)"
                        },

                        border: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // ================================================
    // LOAD WATER DATA
    // ================================================

    async function loadWaterData() {
        try {
            const response = await fetch("data/quality-data.json");

            if (!response.ok) {
                throw new Error("Could not load quality-data.json");
            }

            const data = await response.json();

            if (!data.water || !data.water.indicators) {
                throw new Error("Water indicators are missing from JSON.");
            }

            currentWater = data.water;

        } catch (error) {
            console.error("EcoVision water data error:", error);

            currentWater = {
                ...sampleWater,
                isFallback: true
            };
        }

        updateWaterValues(currentWater);
        createWaterChart();
    }

    // ================================================
    // DROPDOWN
    // ================================================

    if (indicatorSelect) {
        indicatorSelect.addEventListener("change", createWaterChart);
    }

    // Adjust compact chart height when the screen changes.
    window.addEventListener("resize", () => {
        if (!chartBox) return;

        const height = window.innerWidth <= 600 ? "235px" : "280px";
        chartBox.style.height = height;
        chartBox.style.maxHeight = height;

        if (waterChart) {
            waterChart.resize();
        }
    });

    loadWaterData();
});
