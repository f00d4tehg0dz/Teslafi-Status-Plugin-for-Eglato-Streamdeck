let intervals = {};

if ($SD) {
    const actionName = "com.f00d4tehg0dz.teslafi.action";

    $SD.on("connected", () => console.log("Connected!"));

    $SD.on(`${actionName}.willAppear`, (jsonObj) => {
        const settings = jsonObj.payload.settings;
        if (settings.automaticRefresh && settings.apiKey && settings.distanceType && settings.degreeType) {
            initiateTeslaFiStatus(jsonObj.context, settings);
        }
    });

    $SD.on(`${actionName}.sendToPlugin`, (jsonObj) => {
        $SD.api.setSettings(jsonObj.context, jsonObj.payload);
        initiateTeslaFiStatus(jsonObj.context, jsonObj.payload);
    });

    $SD.on(`${actionName}.keyUp`, (jsonObj) => {
        initiateTeslaFiStatus(jsonObj.context, jsonObj.payload.settings);
    });

    function initiateTeslaFiStatus(context, settings) {
        clearInterval(intervals[context]);
        updateTeslaFiStatus(context, settings);
        if (settings.automaticRefresh) {
            intervals[context] = setInterval(() => updateTeslaFiStatus(context, settings), moment.duration(60, 'minutes').asMilliseconds());
        }
    }

    function updateTeslaFiStatus(context, settings) {
        setTitle(context, "Updating");
        getTeslaFiData(settings.apiKey, (result) => {
            clearTitle(context);
            updateCanvasWithStatus(result, context, settings);
        });
    }

    function setTitle(context, title) {
        $SD.api.setTitle(context, title);
    }

    function clearTitle(context) {
        $SD.api.setTitle(context, "");
    }

    function updateCanvasWithStatus(result, context, settings) {
        const canvas = createCanvas();
        const ctx = canvas.getContext('2d');

        drawBackground(ctx);

        if (result.error) {
            drawErrorMessage(ctx, result.error);
        } else {
            const fieldsToShow = prepareStatusLines(result, settings.fields, settings);
            const allNA = fieldsToShow.every(line => line.text === 'N/A');

            if (allNA) {
                drawErrorMessage(ctx, "API Limit Error");
            } else {
                drawStatusText(ctx, fieldsToShow);
            }
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
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.clearRect(0, 0, 144, 144);
        ctx.fillText("API Limit Error", 72, 50);
        ctx.fillText("Wait up to 20 minutes", 72, 70);
    }

    function drawStatusText(ctx, lines) {
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        lines.forEach(({ text, color, icon }, i) => {
            ctx.fillStyle = color;
            const iconElement = document.getElementById(icon);
            ctx.drawImage(iconElement, 10, 24 * i + 10); 
            ctx.fillText(text, 30, 24 * i + 15);
        });
    }

    function prepareStatusLines(result, fields, settings) {
        return fields.map(field => {
            switch (field) {
                case 'display_name':
                    return { text: result.display_name || 'N/A', color: "white", icon: "car-icon" };
                case 'inside_temp':
                    const insideTemp = settings.degreeType === 1 ? convertToCelsius(result.inside_temp) : result.inside_temp;
                    return { text: insideTemp ? `${insideTemp}°` : 'N/A', color: "#ff6b6b", icon: "temperature-icon" };
                case 'battery_range':
                    const batteryRange = settings.distanceType === 1 ? convertToKm(result.battery_range) : result.battery_range;
                    return { text: batteryRange ? `${batteryRange} ${settings.distanceType === 1 ? 'km' : 'mi'}` : 'N/A', color: "#45b6fe", icon: "distance-icon" };
                case 'charging_state':
                    return { text: result.charging_state || 'N/A', color: "#c7f464", icon: "charging-icon" };
                case 'outside_temp':
                    const outsideTemp = settings.degreeType === 1 ? convertToCelsius(result.outside_temp) : result.outside_temp;
                    return { text: outsideTemp ? `${outsideTemp}°` : 'N/A', color: "#ff6b6b", icon: "temperature-icon" };
                case 'odometer':
                    const odometer = settings.distanceType === 1 ? convertToKm(result.odometer) : result.odometer;
                    return { text: odometer ? `${odometer} ${settings.distanceType === 1 ? 'km' : 'mi'}` : 'N/A', color: "white", icon: "car-icon" };
                default:
                    return { text: 'N/A', color: 'white', icon: 'car-icon' };
            }
        });
    }

    function getTeslaFiData(apiKey, callback) {
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
                if (jqxhr.status === 503) {
                    callback({error: "API Limit Error"});
                } else {
                    callback({error: jqxhr.statusText});
                }
            });
    }

    function convertToCelsius(fahrenheit) {
        return Math.round((fahrenheit - 32) * (5 / 9));
    }

    function convertToKm(miles) {
        return Math.round(miles * 1.609344);
    }
}
