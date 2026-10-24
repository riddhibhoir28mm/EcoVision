// ==========================================
// ECOVISION - AIR QUALITY
// ==========================================

const airAqiNumber =
    document.querySelector(
        ".aqi-main-card .aqi-number"
    );

const airAqiStatus =
    document.querySelector(
        ".aqi-main-card .aqi-status"
    );

const staticPm25 =
    document.getElementById("staticPm25");

const staticPm10 =
    document.getElementById("staticPm10");

const staticNo2 =
    document.getElementById("staticNo2");

const staticO3 =
    document.getElementById("staticO3");


// ==========================================
// LOAD FALLBACK DATA
// ==========================================

fetch("data/quality-data.json")

    .then(response => {

        if (!response.ok) {
            throw new Error(
                "Could not load quality-data.json"
            );
        }

        return response.json();
    })

    .then(data => {

        const air =
            data.air;


        if (airAqiNumber) {

            airAqiNumber.textContent =
                air.aqi;
        }


        if (airAqiStatus) {

            airAqiStatus.textContent =
                air.status.toUpperCase();
        }


        if (staticPm25) {

            staticPm25.textContent =
                air.pollutants["PM2.5"];
        }


        if (staticPm10) {

            staticPm10.textContent =
                air.pollutants["PM10"];
        }


        if (staticNo2) {

            staticNo2.textContent =
                air.pollutants["NO2"];
        }


        if (staticO3) {

            staticO3.textContent =
                air.pollutants["O3"];
        }

    })

    .catch(error => {

        console.error(
            "EcoVision Air Data Error:",
            error
        );

    });