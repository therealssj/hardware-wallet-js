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
            resolve("Device cleaned up.");
        }, (msg) => {
            console.log(msg);
            reject(new Error("setup failed"));
        });
    });
};

const generateTwelveWordsSeedOk = function (t) {
    return new Promise((resolve, reject) => {
        const setupPromise = setup();
        setupPromise.then(() => {
            const gMnemonicPromise = deviceWallet.devGenerateMnemonic(12, false);
            gMnemonicPromise.then(() => {
                resolve("Test generate with 12 words success.");
            }, (msg) => {
                rejectPromise(msg);
            });
        }, rejectPromise);
    });
};

const generateTwentyFourWordsSeedOk = function (t) {
    return new Promise((resolve, reject) => {
        const setupPromise = setup();
        setupPromise.then(() => {
            const gMnemonicPromise = deviceWallet.devGenerateMnemonic(24, false);
            gMnemonicPromise.then(() => {
                resolve("Test generate with 24 words success.");
            }, (msg) => {
                rejectPromise(msg);
            });
        }, rejectPromise);
    });
};

const generateSeventeenWordsSeedFail = function (t) {
    return new Promise((resolve, reject) => {
        const setupPromise = setup();
        setupPromise.then((msg) => {
            const gMnemonicPromise = deviceWallet.devGenerateMnemonic(17, false);
            gMnemonicPromise.then((msg) => {
                rejectPromise('Should work wih 12 or 24 word count only ' + msg);
            }, (msg) => {
                resolve("Test generate with 17 words failed as expected.", msg);
            });
        }, rejectPromise);
    });
};

suite.test('Transactions', async function (t) {
    if (deviceWallet.getDevice() === null) {
        console.log("Skycoin hardware NOT FOUND, using emulator");
        deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.EMULATOR);
    } else {
        console.log("Skycoin hardware is plugged in");
        deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.USB);
    }

    var testPromise = new Promise(function (resolve, reject) {
        setTimeout(function () {
            generateTwelveWordsSeedOk(t).then(() => {
                return generateTwentyFourWordsSeedOk(t);
            }).then(() => {
                return generateSeventeenWordsSeedFail(t);
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