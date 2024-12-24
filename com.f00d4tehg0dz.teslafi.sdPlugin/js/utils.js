let result = {}; // Declare result object outside the function to accumulate data
const expectedFields = [
    'display_name',
    'inside_temp',
    'inside_tempF',
    'battery_range',
    'battery_level',
    'ideal_battery_range_km',
    'rated_battery_range_km',
    'charging_state',
    'outside_temp',
    'outside_tempF',
    'odometer',
    'est_battery_range',
    'est_battery_range_km'
];

export function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 144;
    canvas.height = 144;
    return canvas;
}

export function drawBackground(ctx) {
    const bg = document.getElementById("bg");
    ctx.drawImage(bg, 0, 0);
}

export function drawErrorMessage(context, message) {
    const canvas = document.createElement('canvas');
    canvas.width = 144;
    canvas.height = 144;
    const ctx = canvas.getContext('2d');

    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.clearRect(0, 0, 144, 144);
    ctx.fillText(message, 72, 72);

    $SD.api.setImage(context, canvas.toDataURL());
}

export function drawStatusText(ctx, lines, isNew) {
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    lines.forEach(({ text, color, icon }, i) => {
        ctx.fillStyle = color;
        const iconElement = document.getElementById(icon);
        ctx.drawImage(iconElement, 10, 24 * i + 10);
        ctx.fillText(text, 30, 24 * i + 15);
    });

    if (isNew) {
        setTimeout(() => clearTitle(ctx), 2000);
    }
}

function clearTitle(context) {
    $SD.api.setTitle(context, "");
}

export function prepareStatusLines(result, fields, settings) {
    return fields.slice(0, 5).map(field => {
        switch (field) {
            case 'display_name':
                return { text: result.display_name || 'N/A', color: "white", icon: "car-icon" };
            case 'inside_temp':
                const insideTemp = settings.degreeType === 0 
                    ? convertToFahrenheit(result.inside_temp) 
                    : result.inside_temp;
                return { text: insideTemp !== null ? `${insideTemp}°` : 'N/A', color: "#ff6b6b", icon: "temperature-icon" };
            case 'battery_range':
                let batteryRange = settings.apiProvider === "teslafi" 
                    ? result.battery_range || result.ideal_battery_range 
                    : (settings.batteryRangeType === "ideal" 
                        ? result.ideal_battery_range_km 
                        : result.rated_battery_range_km);

                if (settings.distanceType === 0) { // If miles selected, convert from km to miles if necessary
                    batteryRange = settings.apiProvider === "teslafi" ? batteryRange : convertToMiles(batteryRange);
                } else { // If km selected, use the value directly
                    batteryRange = settings.apiProvider === "teslafi" ? convertToKm(batteryRange) : batteryRange;
                }
                return { text: batteryRange !== null ? `${batteryRange} ${settings.distanceType === 0 ? 'mi' : 'km'}` : 'N/A', color: "#45b6fe", icon: "distance-icon" };
            case 'battery_level':
                let battery_level = settings.apiProvider === "teslafi" 
                    ? result.usable_battery_level
                    : result.battery_level;
                const colorMap = {
                    70: "#c7f464", // green
                    50: "#45b6fe", // blue
                    30: "#fffff", // white
                    0: "#ff6b6b" // red
                }
                let levelZone = Object.keys(colorMap)
                    .sort((a, b) => b - a)  // Sort keys in descending order
                    .find(level => battery_level >= level) || 30;  // Find the first key that is less than or equal to battery_level
                return { text: battery_level + '%' || 'N/A', color: colorMap[levelZone], icon: "battery-icon" };
            case 'charging_state':
                return { text: result.charging_state || 'N/A', color: "#c7f464", icon: "charging-icon" };
            case 'outside_temp':
                const outsideTemp = settings.degreeType === 0 
                    ? convertToFahrenheit(result.outside_temp) 
                    : result.outside_temp;
                return { text: outsideTemp !== null ? `${outsideTemp}°` : 'N/A', color: "#ff6b6b", icon: "temperature-icon" };
            case 'odometer':
                let odometer = settings.apiProvider === "teslafi"
                    ? (settings.distanceType === 0 ? Math.round(result.odometer) : convertToKm(result.odometer))
                    : (settings.distanceType === 0 ? Math.round(convertToMiles(result.odometer)) : Math.round(result.odometer));
                return { text: odometer !== null ? `${odometer} ${settings.distanceType === 0 ? 'mi' : 'km'}` : 'N/A', color: "white", icon: "car-icon" };
            case 'est_battery_range':
                let estBatteryRange = settings.apiProvider === "teslafi" 
                    ? result.est_battery_range 
                    : result.est_battery_range_km;

                if (settings.distanceType === 0) { // If miles selected, convert from km to miles if necessary
                    estBatteryRange = settings.apiProvider === "teslafi" ? estBatteryRange : convertToMiles(estBatteryRange);
                } else { // If km selected, use the value directly
                    estBatteryRange = settings.apiProvider === "teslafi" ? convertToKm(estBatteryRange) : estBatteryRange;
                }
                return { text: estBatteryRange !== null ? `${estBatteryRange} ${settings.distanceType === 0 ? 'mi' : 'km'}` : 'N/A', color: "#45b6fe", icon: "distance-icon" };
            default:
                return { text: 'N/A', color: 'white', icon: 'car-icon' };
        }
    });
}

export function getTeslaData(apiProvider, apiKey, teslamateUrl, mqttUsername, mqttPassword, vehicle, context, callback, useTestJson = false) {
    if (useTestJson) {
        fetch('test.json')
            .then(response => response.json())
            .then(response => callback(response))
            .catch(error => callback({error: error.message}));
    } else if (apiProvider === "teslafi") {
        const endpoint = `https://www.teslafi.com/feed.php?token=${apiKey}`;
        $.getJSON(endpoint, {apikey: apiKey})
            .done(response => {
                const allNA = Object.values(response).every(value => value === null || value === undefined);
                if (allNA) {
                    callback({error: "API Limit Error"});
                } else {
                    callback(response);
                }
            })
            .fail((jqxhr) => {
                if (jqxhr.status === 429) {
                    callback({error: "API Limit Error"});
                } else {
                    callback({error: jqxhr.statusText});
                }
            });
    } else if (apiProvider === "teslamate") {
        // console.log('Connecting to MQTT broker at:', teslamateUrl);

        const client = new Paho.MQTT.Client(teslamateUrl, Number(9001), "/mqtt", "clientId");

        client.onConnectionLost = function (responseObject) {
            if (responseObject.errorCode !== 0) {
                // console.log("onConnectionLost:", responseObject.errorMessage);
                drawErrorMessage(context, "Connection Lost: " + responseObject.errorMessage);
            }
        };

        client.onMessageArrived = function (message) {
            // console.log('Message arrived: ', message.payloadString);
            const field = message.destinationName.split('/')[3];
            // console.log('Field: ', field);

            result[field] = message.payloadString;
            result.display_name = result.display_name || vehicle;

            // console.log('Current result object: ', result);

            if (expectedFields.every(field => field in result)) {
                // console.log('All fields received, disconnecting client');
                client.disconnect();
                callback(result);
            } else {
                callback(result);
            }
        };

        const options = {
            onSuccess: function () {
                // console.log("Connected to MQTT broker");
                const topics = expectedFields.map(field => `teslamate/cars/${vehicle}/${field}`);
                topics.forEach(topic => {
                    // console.log('Subscribing to topic:', topic);
                    client.subscribe(topic);
                });
            },
            onFailure: function (message) {
                // console.log("Connection failed: " + message.errorMessage);
                drawErrorMessage(context, "Connection Failed: " + message.errorMessage);
            },
            userName: mqttUsername,
            password: mqttPassword
        };

        client.connect(options);
    }
}

export function saveLastState(context, result, settings) {
    const state = { result, settings };
    localStorage.setItem(context, JSON.stringify(state));
}

export function loadLastState(context) {
    const state = JSON.parse(localStorage.getItem(context));
    if (state) {
        return state;
    }
    return null;
}

export function convertToCelsius(fahrenheit) {
    return Math.round((fahrenheit - 32) * (5 / 9));
}

export function convertToKm(miles) {
    return Math.round(miles * 1.609344);
}

export function convertToFahrenheit(celsius) {
    return Math.round((celsius * 9/5) + 32);
}

export function convertToMiles(km) {
    return Math.round(km * 0.621371);
}

export { expectedFields };