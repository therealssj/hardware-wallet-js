const Suite = require('node-test');
const deviceWallet = require('../device-wallet');

const suite = new Suite('Transaction testing');

const rejectPromise = function (msg) {
    console.log("Promise rejected", msg);
};

const setup = function () {
    return new Promise((resolve, reject) => {
        const wipePromise = deviceWallet.devWipeDevice();
        wipePromise.then(() => {
            resolve("Set up done.");
        }, (msg) => {
            console.log(msg);
            reject(new Error("setup failed"));
        });
    });
};

const sample_1 = function (t) {
    return new Promise((resolve, reject) => {
        const setupPromise = setup();
        setupPromise.then(() => {
            const getFeaturesPromise1 = deviceWallet.devGetFeatures();
            getFeaturesPromise1.then((features1) => {
                var deviceLabel = 'My dev device';
                if (features1.label !== deviceLabel) {
                    var applySettingsPromise = deviceWallet.devApplySettings(false, deviceLabel);
                    applySettingsPromise.then(() => {
                        var getFeaturesPromise2 = deviceWallet.devGetFeatures();
                        getFeaturesPromise2.then((features2) => {
                            if (deviceLabel === features2.label) {
                                resolve("Setting applied as expected.");
                            } else {
                                reject("Apply setting failed.");
                            }
                        }, rejectPromise);
                    }, rejectPromise);
                } else {
                    reject("Label should be different at test startup.");
                }
            }, rejectPromise);
        }, rejectPromise);
    });
};

suite.test('Apply Setting -> label', async function (t) {
    if (deviceWallet.getDevice() === null) {
        console.log("Skycoin hardware NOT FOUND, using emulator");
        deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.EMULATOR);
    } else {
        console.log("Skycoin hardware is plugged in");
        deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.USB);
    }

    var testPromise = new Promise(function (resolve, reject) {
        setTimeout(function () {
            sample_1(t).then(() => {
                return 0;
            }, () => {
                return -1;
            });
        }, 200);
    });

    try {
        var result = await testPromise;
        expect(result).to.equal(0);
        process.exit(0);
    }
    catch (err) {
        console.log('Not success');
    }
}).setTimeout(Infinity);
