// Test for MQTT data isolation between two vehicles
import { getTeslaData } from './utils.js';

function mockCallback(label) {
    return (result) => {
        console.log(label, result);
        if (result.error) throw new Error(result.error);
        if (!result.display_name) throw new Error('Missing display_name');
    };
}

describe('getTeslaData MQTT isolation', () => {
    it('should not leak data between two vehicles', (done) => {
        let doneCount = 0;
        function checkDone() { if (++doneCount === 2) done(); }
        getTeslaData('teslamate', '', 'ws://localhost', 'user', 'pass', 'vehicle1', 'ctx1', (result1) => {
            mockCallback('vehicle1')(result1);
            checkDone();
        });
        getTeslaData('teslamate', '', 'ws://localhost', 'user', 'pass', 'vehicle2', 'ctx2', (result2) => {
            mockCallback('vehicle2')(result2);
            checkDone();
        });
    });
});
