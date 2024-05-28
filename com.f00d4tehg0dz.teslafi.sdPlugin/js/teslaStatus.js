import { createCanvas, drawBackground, drawErrorMessage, drawStatusText, prepareStatusLines, getTeslaData, saveLastState, loadLastState, expectedFields } from './utils.js';

let intervals = {};

export function initiateTeslaStatus(context, settings) {
    if (intervals[context]) {
        clearInterval(intervals[context]);
    }
    updateTeslaStatus(context, settings);
    if (settings.automaticRefresh) {
        intervals[context] = setInterval(() => updateTeslaStatus(context, settings), moment.duration(20, 'minutes').asMilliseconds());
    }
}

export function updateTeslaStatus(context, settings) {
    setTitle(context, "Updating");
    getTeslaData(settings.apiProvider, settings.apiKey, settings.teslamateUrl, settings.mqttUsername, settings.mqttPassword, settings.vehicle, context, (result) => {
        clearTitle(context);

        // Initialize all expected fields to 'N/A'
        const completeResult = {};
        expectedFields.forEach(field => {
            completeResult[field] = result[field] || 'N/A';
        });

        const fieldsToShow = prepareStatusLines(completeResult, settings.fields.slice(0, 5), settings);
        const allNA = fieldsToShow.every(line => line.text === 'N/A' || line.text === 'NaN' || line.text === 'NaN°' || line.text === '0 mi' || line.text === '0 km' || line.text === '°');

        if (allNA || result.error) {
            const lastState = loadLastState(context);
            if (lastState) {
                updateCanvasWithStatus(lastState.result, context, settings, false);
            } else {
                drawErrorMessage(context, "API Limit Error or Vehicle Asleep");
            }
        } else {
            saveLastState(context, completeResult, settings);
            updateCanvasWithStatus(completeResult, context, settings, true);
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
        const fieldsToShow = prepareStatusLines(result, settings.fields.slice(0, 5), settings);
        drawStatusText(ctx, fieldsToShow, isNew);
    }

    $SD.api.setImage(context, canvas.toDataURL());
}

export { loadLastState, expectedFields };