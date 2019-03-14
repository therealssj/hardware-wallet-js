const deviceWallet = require('../device-wallet');
const rejectPromise = require('util').rejectPromise;

const setup = function () {
    return deviceWallet.devWipeDevice().
        then(
            () => "Set up done.",
            rejectPromise(reject, "setup failed")
        );
};

describe('Apply Setting -> label', function () {
    it("Should apply device label settings", () => {
        if (deviceWallet.getDevice() === null) {
            console.log("Skycoin hardware NOT FOUND, using emulator");
            deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.EMULATOR);
        } else {
            console.log("Skycoin hardware is plugged in");
            deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.USB);
        }

        return setup().
            then(deviceWallet.devGetFeatures).
            then((features1) => {
                const deviceLabel = 'My dev device';
                if (features1.label === deviceLabel) {
                    return Promise.reject(new Error("Label should be different at test startup."));
                }
                return deviceWallet.devApplySettings(false, deviceLabel);
            }).
            then(deviceWallet.devGetFeatures).
            then((features2) => {
               if (deviceLabel === features2.label) {
                    return "Setting applied as expected.";
               }
               return Promise.reject(new Error("Apply setting failed."));
            }).
            catch((err) => {
                console.log(err);
                return Promise.reject(err);
            });
    });
});
