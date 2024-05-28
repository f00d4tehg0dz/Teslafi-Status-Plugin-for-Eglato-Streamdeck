let intervals = {};

if ($SD) {
    const actionName = "com.f00d4tehg0dz.teslastatus.action";

    $SD.on("connected", () => console.log("Connected!"));

    $SD.on(`${actionName}.willAppear`, (jsonObj) => {
        const settings = jsonObj.payload.settings;
        if (settings.apiKey && settings.distanceType && settings.degreeType) {
            initiateTeslaStatus(jsonObj.context, settings);
        }
        if (settings.automaticRefresh && settings.apiKey && settings.distanceType && settings.degreeType) {
            initiateTeslaStatus(jsonObj.context, settings);
        }
    });

    $SD.on(`${actionName}.sendToPlugin`, (jsonObj) => {
        $SD.api.setSettings(jsonObj.context, jsonObj.payload);
        initiateTeslaStatus(jsonObj.context, jsonObj.payload);
    });

    $SD.on(`${actionName}.keyUp`, (jsonObj) => {
        initiateTeslaStatus(jsonObj.context, jsonObj.payload.settings);
    });

    function initiateTeslaStatus(context, settings) {
        clearInterval(intervals[context]);
        updateTeslaStatus(context, settings);
        if (settings.automaticRefresh) {
            intervals[context] = setInterval(() => updateTeslaStatus(context, settings), moment.duration(20, 'minutes').asMilliseconds());
        }
    }

    function updateTeslaStatus(context, settings) {
        setTitle(context, "Updating");
        getTeslaData(settings.apiProvider, settings.apiKey, settings.teslamateUrl, settings.mqttUsername, settings.mqttPassword, settings.vehicle, (result) => {
            clearTitle(context);
            const fieldsToShow = prepareStatusLines(result, settings.fields, settings);
            const allNA = fieldsToShow.every(line => line.text === 'N/A' || line.text === '0 mi' || line.text === '0 km' || line.text === '°');

            if (allNA || result.error) {
                const lastState = loadLastState(context, settings);
                if (lastState) {
                    updateCanvasWithStatus(lastState.result, context, settings, false);
                } else {
                    drawErrorMessage(context, "API Limit Error or Vehicle Asleep");
                }
            } else {
                saveLastState(context, result, settings);
                updateCanvasWithStatus(result, context, settings, true);
            }
        });
    }

    function setTitle(context, title) {
        $SD.api.setTitle(context, title);
    }

    function clearTitle(context) {
        $SD.api.setTitle(context, "");
    }

    function updateCanvasWithStatus(result, context, settings, isNew) {
        const canvas = createCanvas();
        const ctx = canvas.getContext('2d');

        drawBackground(ctx);

        if (result.error) {
            drawErrorMessage(ctx, result.error);
        } else {
            const fieldsToShow = prepareStatusLines(result, settings.fields, settings);
            drawStatusText(ctx, fieldsToShow, isNew);
        }

        $SD.api.setImage(context, canvas.toDataURL());
    }

    function createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = 144;
        canvas.height = 144;
        return canvas;
    }

    function drawBackground(ctx) {
        const bg = document.getElementById("bg");
        ctx.drawImage(bg, 0, 0);
    }

    function drawErrorMessage(ctx, message) {
        if (!ctx || typeof ctx.clearRect !== 'function') {
            console.error('Invalid canvas context:', ctx);
            return;
        }
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.clearRect(0, 0, 144, 144);
        ctx.fillText(message, 72, 50);
    }

    function drawStatusText(ctx, lines, isNew) {
        ctx.font = 'bold 20px Arial';
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

    function prepareStatusLines(result, fields, settings) {
        return fields.map(field => {
            switch (field) {
                case 'display_name':
                    return { text: result.display_name || 'N/A', color: "white", icon: "car-icon" };
                case 'inside_temp':
                    const insideTemp = settings.degreeType === 1 ? result.inside_temp : result.inside_tempF;
                    return { text: insideTemp !== null ? `${insideTemp}°` : 'N/A', color: "#ff6b6b", icon: "temperature-icon" };
                case 'battery_range':
                    const batteryRange = settings.distanceType === 1 ? convertToKm(result.battery_range) : result.battery_range;
                    return { text: batteryRange !== null ? `${batteryRange} ${settings.distanceType === 1 ? 'km' : 'mi'}` : 'N/A', color: "#45b6fe", icon: "distance-icon" };
                case 'charging_state':
                    return { text: result.charging_state || 'N/A', color: "#c7f464", icon: "charging-icon" };
                case 'outside_temp':
                    const outsideTemp = settings.degreeType === 1 ? result.outside_temp : result.outside_tempF;
                    return { text: outsideTemp !== null ? `${outsideTemp}°` : 'N/A', color: "#ff6b6b", icon: "temperature-icon" };
                case 'odometer':
                    const odometer = settings.distanceType === 1 ? Math.round(convertToKm(result.odometer)) : Math.round(result.odometer);
                    return { text: odometer !== null ? `${odometer} ${settings.distanceType === 1 ? 'km' : 'mi'}` : 'N/A', color: "white", icon: "car-icon" };
                case 'est_battery_range':
                    const estBatteryRange = settings.distanceType === 1 ? convertToKm(result.est_battery_range) : result.est_battery_range;
                    return { text: estBatteryRange !== null ? `${estBatteryRange} ${settings.distanceType === 1 ? 'km' : 'mi'}` : 'N/A', color: "#45b6fe", icon: "distance-icon" };
                default:
                    return { text: 'N/A', color: 'white', icon: 'car-icon' };
            }
        });
    }

    function getTeslaData(apiProvider, apiKey, teslamateUrl, mqttUsername, mqttPassword, vehicle, callback) {
        if (apiProvider === "teslafi") {
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
            console.log('Connecting to MQTT broker at:', teslamateUrl);
            
            const options = {};
            if (mqttUsername) {
                options.username = mqttUsername;
                console.log('Using MQTT Username:', mqttUsername);
            }
            if (mqttPassword) {
                options.password = mqttPassword;
                console.log('Using MQTT Password:', mqttPassword);
            }
    
            const client = mqtt.connect(teslamateUrl, options);
    
            client.on('connect', function () {
                console.log('Connected to MQTT broker');
                const topics = [
                    `teslamate/cars/${vehicle}/display_name`,
                    `teslamate/cars/${vehicle}/inside_temp`,
                    `teslamate/cars/${vehicle}/inside_tempF`,
                    `teslamate/cars/${vehicle}/battery_range`,
                    `teslamate/cars/${vehicle}/charging_state`,
                    `teslamate/cars/${vehicle}/outside_temp`,
                    `teslamate/cars/${vehicle}/outside_tempF`,
                    `teslamate/cars/${vehicle}/odometer`,
                    `teslamate/cars/${vehicle}/est_battery_range`
                ];
                topics.forEach(topic => {
                    console.log('Subscribing to topic:', topic);
                    client.subscribe(topic);
                });
    
                const result = {};
                client.on('message', function (topic, message) {
                    const field = topic.split('/')[3];
                    result[field] = message.toString();
                    result.display_name = result.display_name || vehicle; // Use vehicle as display_name if not provided
    
                    if (Object.keys(result).length === 9) {
                        client.end();
                        callback(result);
                    }
                });
            });
    
            client.on('error', function (error) {
                console.error('MQTT Connection Error:', error.message);
                client.end();
                callback({ error: error.message });
            });
        }
        
    }

    function saveLastState(context, result, settings) {
        const state = { result, settings };
        localStorage.setItem(context, JSON.stringify(state));
    }

    function loadLastState(context, settings) {
        const state = JSON.parse(localStorage.getItem(context));
        if (state) {
            return state;
        }
        return null;
    }

    function convertToCelsius(fahrenheit) {
        return Math.round((fahrenheit - 32) * (5 / 9));
    }

    function convertToKm(miles) {
        return Math.round(miles * 1.609344);
    }
}
