const deviceWallet = require('../device-wallet');
const assert = require('chai').assert;
const rejectPromise = require('../utils').rejectPromise;

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

const generateTwelveWordsSeedOk = function () {
  return new Promise((resolve, reject) => {
    const setupPromise = setup();
    setupPromise.then(() => {
      const gMnemonicPromise = deviceWallet.devGenerateMnemonic(12, false);
      gMnemonicPromise.then(() => {
        resolve("Test generate with 12 words success.");
      }, rejectPromise(reject));
    }, rejectPromise(reject));
  });
};

const generateTwentyFourWordsSeedOk = function () {
  return new Promise((resolve, reject) => {
    const setupPromise = setup();
    setupPromise.then(() => {
      const gMnemonicPromise = deviceWallet.devGenerateMnemonic(24, false);
      gMnemonicPromise.then(() => {
        resolve("Test generate with 24 words success.");
      }, rejectPromise(reject));
    }, rejectPromise(reject));
  });
};

const generateSeventeenWordsSeedFail = function () {
  return new Promise((resolve, reject) => {
    const setupPromise = setup();
    setupPromise.then(() => {
      const gMnemonicPromise = deviceWallet.devGenerateMnemonic(17, false);
      gMnemonicPromise.then((msg) => {
        rejectPromise(reject)(`Should work with 12 or 24 word count only${msg}`);
      }, (msg) => {
        resolve("Test generate with 17 words failed as expected.", msg);
      });
    }, rejectPromise(reject));
  });
};

describe('Transactions', function () {
  if (deviceWallet.getDevice() === null) {
    console.log("Skycoin hardware NOT FOUND, using emulator");
    deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.EMULATOR);
    deviceWallet.setAutoPressButton(true, 'R');
  } else {
    console.log("Skycoin hardware is plugged in");
    deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.USB);
  }

  it('Should have a result equal to zero', function() {
    this.timeout(0);
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        generateTwelveWordsSeedOk().then(() => generateTwentyFourWordsSeedOk()).
          then(() => generateSeventeenWordsSeedFail()).
          then(() => {
            resolve(0);
          }).
          catch(reject);
      }, 200);
    }).then(function(result) {
      assert.equal(result, 0);
    });
  });

});
