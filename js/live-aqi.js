// ==========================================
// ECOVISION - LIVE AIR QUALITY
// ==========================================

const liveCities = {

    mumbai: {
        name: "Mumbai",
        latitude: 19.0760,
        longitude: 72.8777
    },

    pune: {
        name: "Pune",
        latitude: 18.5204,
        longitude: 73.8567
    },

    delhi: {
        name: "Delhi",
        latitude: 28.6139,
        longitude: 77.2090
    },

    bangalore: {
        name: "Bengaluru",
        latitude: 12.9716,
        longitude: 77.5946
    },

    nashik: {
        name: "Nashik",
        latitude: 19.9975,
        longitude: 73.7898
    }
};


// ==========================================
// AQI STATUS
// ==========================================

function getAQIStatus(aqi) {

    if (aqi === null || aqi === undefined || isNaN(aqi)) {
        return "LIVE DATA UNAVAILABLE";
    }

    if (aqi <= 50) return "GOOD";
    if (aqi <= 100) return "MODERATE";
    if (aqi <= 150) return "UNHEALTHY FOR SENSITIVE GROUPS";
    if (aqi <= 200) return "UNHEALTHY";
    if (aqi <= 300) return "VERY UNHEALTHY";

    return "HAZARDOUS";
}


// ==========================================
// AQI CSS CLASS
// ==========================================

function getAQIClass(aqi) {

    if (aqi <= 50) return "aqi-good";
    if (aqi <= 100) return "aqi-moderate";
    if (aqi <= 150) return "aqi-sensitive";
    if (aqi <= 200) return "aqi-unhealthy";
    if (aqi <= 300) return "aqi-very-unhealthy";

    return "aqi-hazardous";
}


// ==========================================
// UPDATE ALL AQI ELEMENTS
// ==========================================

function displayAQI(aqi, status) {

    // --------------------------------------
    // AQI NUMBER
    // --------------------------------------

    const aqiElements = document.querySelectorAll(
        "#locationAQI, .aqi-number, .live-aqi-number"
    );

    aqiElements.forEach(element => {

        element.textContent = aqi;

    });


    // --------------------------------------
    // AQI STATUS
    // --------------------------------------

    const statusElements = document.querySelectorAll(
        "#locationStatus, .aqi-status, .live-aqi-status"
    );

    statusElements.forEach(element => {

        element.textContent = status;

        element.classList.remove(
            "aqi-good",
            "aqi-moderate",
            "aqi-sensitive",
            "aqi-unhealthy",
            "aqi-very-unhealthy",
            "aqi-hazardous"
        );

        element.classList.add(
            getAQIClass(aqi)
        );

    });


    // --------------------------------------
    // SAVE GLOBAL AQI
    // --------------------------------------

    window.currentAQI = aqi;
    window.currentAQIStatus = status;
}


// ==========================================
// DISPLAY POLLUTANTS
// ==========================================

function displayPollutants(pm25, pm10, no2, o3) {

    const values = {

        pm25: Math.round(Number(pm25) || 0),
        pm10: Math.round(Number(pm10) || 0),
        no2: Math.round(Number(no2) || 0),
        o3: Math.round(Number(o3) || 0)

    };


    // --------------------------------------
    // HOME PAGE
    // --------------------------------------

    const homeValues = {

        pm25Value: values.pm25,
        pm10Value: values.pm10,
        no2Value: values.no2,
        o3Value: values.o3

    };


    Object.keys(homeValues).forEach(id => {

        const element = document.getElementById(id);

        if (element) {
            element.textContent = homeValues[id];
        }

    });


    // --------------------------------------
    // AIR QUALITY PAGE
    // --------------------------------------

    const airValues = {

        airPm25: values.pm25,
        airPm10: values.pm10,
        airNo2: values.no2,
        airO3: values.o3

    };


    Object.keys(airValues).forEach(id => {

        const element = document.getElementById(id);

        if (element) {
            element.textContent = airValues[id];
        }

    });


    // --------------------------------------
    // STATIC FALLBACK IDs
    // --------------------------------------

    const staticValues = {

        staticPm25: values.pm25,
        staticPm10: values.pm10,
        staticNo2: values.no2,
        staticO3: values.o3

    };


    Object.keys(staticValues).forEach(id => {

        const element = document.getElementById(id);

        if (element) {
            element.textContent = staticValues[id];
        }

    });


    // --------------------------------------
    // UPDATE ALL POLLUTANT ELEMENTS
    // --------------------------------------

    const pollutantMap = {

        "pm25": values.pm25,
        "pm10": values.pm10,
        "no2": values.no2,
        "o3": values.o3

    };


    Object.keys(pollutantMap).forEach(type => {

        document
            .querySelectorAll(`[data-pollutant="${type}"]`)
            .forEach(element => {

                element.textContent =
                    pollutantMap[type];

            });

    });


    // --------------------------------------
    // SAVE VALUES
    // --------------------------------------

    window.livePollutantValues = values;


    // --------------------------------------
    // UPDATE CHART
    // --------------------------------------

    updatePollutionChart(values);
}


// ==========================================
// UPDATE CHART
// ==========================================

function updatePollutionChart(values) {

    if (!window.pollutionChart) {

        console.log(
            "EcoVision: Chart not initialized yet."
        );

        return;

    }


    window.pollutionChart.data.datasets[0].data = [

        values.pm25,
        values.pm10,
        values.no2,
        values.o3

    ];


    window.pollutionChart.update();

}


// ==========================================
// GET LIVE AQI
// ==========================================

async function getLiveAQI(cityKey) {

    const city = liveCities[cityKey];

    if (!city) {

        console.error(
            "EcoVision: City not found:",
            cityKey
        );

        return;

    }


    // --------------------------------------
    // ELEMENTS
    // --------------------------------------

    const cityMessage =
        document.getElementById("cityMessage");

    const lastUpdated =
        document.getElementById("lastUpdated");


    // --------------------------------------
    // CITY NAME
    // --------------------------------------

    if (cityMessage) {

        cityMessage.textContent =
            "🌍 Live Environmental Quality - " +
            city.name;

    }


    // --------------------------------------
    // LOADING STATE
    // --------------------------------------

    document
        .querySelectorAll(
            "#locationAQI, .aqi-number, .live-aqi-number"
        )
        .forEach(element => {

            element.textContent = "...";

        });


    document
        .querySelectorAll(
            "#locationStatus, .aqi-status, .live-aqi-status"
        )
        .forEach(element => {

            element.textContent =
                "Fetching live data...";

        });


    if (lastUpdated) {

        lastUpdated.textContent =
            "Connecting to live air-quality service...";

    }


    try {

        // --------------------------------------
        // API URL
        // --------------------------------------

        const url =
            "https://air-quality-api.open-meteo.com/v1/air-quality" +
            "?latitude=" + city.latitude +
            "&longitude=" + city.longitude +
            "&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone" +
            "&timezone=auto";


        console.log(
            "EcoVision: Requesting:",
            url
        );


        // --------------------------------------
        // FETCH
        // --------------------------------------

        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "API response: " +
                response.status
            );

        }


        const data =
            await response.json();


        console.log(
            "EcoVision: API DATA:",
            data
        );


        // --------------------------------------
        // CHECK DATA
        // --------------------------------------

        if (
            !data.current ||
            data.current.us_aqi === undefined
        ) {

            throw new Error(
                "AQI value was not returned by API"
            );

        }


        // --------------------------------------
        // GET VALUES
        // --------------------------------------

        const aqi =
            Math.round(
                Number(data.current.us_aqi)
            );


        const pm25 =
            Number(data.current.pm2_5);


        const pm10 =
            Number(data.current.pm10);


        const no2 =
            Number(data.current.nitrogen_dioxide);


        const o3 =
            Number(data.current.ozone);


        const status =
            getAQIStatus(aqi);


        // --------------------------------------
        // DISPLAY AQI
        // --------------------------------------

        displayAQI(
            aqi,
            status
        );


        // --------------------------------------
        // DISPLAY POLLUTANTS
        // --------------------------------------

        displayPollutants(
            pm25,
            pm10,
            no2,
            o3
        );


        // --------------------------------------
        // LAST UPDATED
        // --------------------------------------

        if (lastUpdated) {

            const now =
                new Date();

            lastUpdated.textContent =
                "🟢 Live data updated: " +
                now.toLocaleTimeString();

        }


        console.log(
            "EcoVision LIVE AQI:",
            aqi,
            status
        );

    }

    catch (error) {

        console.error(
            "EcoVision live AQI error:",
            error
        );


        // --------------------------------------
        // ERROR STATE
        // --------------------------------------

        document
            .querySelectorAll(
                "#locationAQI, .aqi-number, .live-aqi-number"
            )
            .forEach(element => {

                element.textContent = "--";

            });


        document
            .querySelectorAll(
                "#locationStatus, .aqi-status, .live-aqi-status"
            )
            .forEach(element => {

                element.textContent =
                    "LIVE DATA UNAVAILABLE";

                element.classList.remove(
                    "aqi-good",
                    "aqi-moderate",
                    "aqi-sensitive",
                    "aqi-unhealthy",
                    "aqi-very-unhealthy",
                    "aqi-hazardous"
                );

            });


        if (lastUpdated) {

            lastUpdated.textContent =
                "Unable to connect to live air-quality service.";

        }

    }

}


// ==========================================
// CITY SELECTOR
// ==========================================

function selectCity() {

    const select =
        document.getElementById("citySelect");


    if (!select) return;


    getLiveAQI(
        select.value
    );

}


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const select =
            document.getElementById("citySelect");


        if (!select) {

            console.log(
                "EcoVision: citySelect not found on this page."
            );

            return;

        }


        // --------------------------------------
        // CITY CHANGE
        // --------------------------------------

        select.addEventListener(
            "change",
            function () {

                getLiveAQI(
                    this.value
                );

            }
        );


        // --------------------------------------
        // INITIAL LOAD
        // --------------------------------------

        getLiveAQI(
            select.value
        );

    }
);