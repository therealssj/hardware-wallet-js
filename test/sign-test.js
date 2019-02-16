const Suite = require('node-test');
const deviceWallet = require('../device-wallet');

const suite = new Suite('Transaction testing');

const rejectPromise = function (msg) {
    console.log("Promise rejected", msg);
};

const wordReader = function () {
    return new Promise((resolve) => {
        console.log("Inside wordReader callback, please input word: ");
        const word = scanf('%s');
        resolve(word);
    });
};

const pinCodeReader = function () {
    return new Promise((resolve, reject) => {
        console.log("Got inside pinCodeReader");
        const pinCode = scanf('%s');
        if (pinCode.length != 4) {
            reject(new Error("Bad bad pin code"));
            return;
        }
        resolve(pinCode);
    });
};

const setup = function () {
    return new Promise((resolve, reject) => {
        const wipePromise = deviceWallet.devWipeDevice();
        wipePromise.then(() => {
            const genMneonicPromise = deviceWallet.devGenerateMnemonic(12, false);
            genMneonicPromise.then(() => resolve("Set up done."), rejectPromise);
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
            var genAddrPromise = deviceWallet.devAddressGen(1);
            genAddrPromise.then((addresses) => {
                var messageHash = "181bd5656115172fe81451fae4fb56498a97744d89702e73da75ba91ed5200f9";
                var signMessagePromise = deviceWallet.devSkycoinSignMessage(0, messageHash);
                signMessagePromise.then((signature) => {
                    var checkMsgPromise = deviceWallet.devCheckMessageSignature(addresses[0], messageHash, signature);
                    checkMsgPromise.then((strResponse) => {
                        resolve('Test success ' + strResponse);
                    }, (err) => {
                        rejectPromise(err);
                    });
                }, rejectPromise);
            }, rejectPromise);
        }, rejectPromise);
    });
};

const sample_2 = function (t) {
    return new Promise((resolve, reject) => {
        const setupPromise = setup();
        setupPromise.then(() => {
            var genAddrPromise = deviceWallet.devAddressGen(1);
            genAddrPromise.then((addresses) => {
                var messageHash = "01a9ef6c25271229ef9760e1536c3dc5ccf0ead7de93a64c12a01340670d87e9";
                var signMessagePromise = deviceWallet.devSkycoinSignMessage(0, messageHash);
                signMessagePromise.then((signature) => {
                    var checkMsgPromise = deviceWallet.devCheckMessageSignature(addresses[0], messageHash, signature);
                    checkMsgPromise.then((strResponse) => {
                        resolve('Test success ' + strResponse);
                    }, (err) => {
                        rejectPromise(err);
                    });
                }, rejectPromise);
            }, rejectPromise);
        }, rejectPromise);
    });
};

suite.test('Sign message', async function (t) {
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
                return sample_2(t);
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
