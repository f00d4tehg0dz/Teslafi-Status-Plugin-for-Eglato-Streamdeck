import { initiateTeslaStatus, updateTeslaStatus, loadLastState } from './teslaStatus.js';

let intervals = {};

if ($SD) {
    const actionName = "com.f00d4tehg0dz.teslafi.action";

    $SD.on("connected", () => console.log("Connected!"));

    $SD.on(`${actionName}.willAppear`, (jsonObj) => {
        const settings = jsonObj.payload.settings;
        const context = jsonObj.context;
        if (settings.apiKey && settings.distanceType && settings.degreeType) {
            initiateTeslaStatus(context, settings);
        }
        if (settings.automaticRefresh) {
            initiateTeslaStatus(context, settings);
        }
    });

    $SD.on(`${actionName}.sendToPlugin`, (jsonObj) => {
        const context = jsonObj.context;
        $SD.api.setSettings(context, jsonObj.payload);
        initiateTeslaStatus(context, jsonObj.payload);
    });

    $SD.on(`${actionName}.keyUp`, (jsonObj) => {
        const context = jsonObj.context;
        initiateTeslaStatus(context, jsonObj.payload.settings);
    });
}

export { intervals };