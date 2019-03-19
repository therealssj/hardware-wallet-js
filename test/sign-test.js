const deviceWallet = require('../device-wallet');
const assert = require('chai').assert;
const rejectPromise = require('../utils').rejectPromise;

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

const sample1 = function () {
  return new Promise((resolve, reject) => {
    const setupPromise = setup();
    setupPromise.then(() => {
      const genAddrPromise = deviceWallet.devAddressGen(1);
      genAddrPromise.then((addresses) => {
        const messageHash = "181bd5656115172fe81451fae4fb56498a97744d89702e73da75ba91ed5200f9";
        const signMessagePromise = deviceWallet.devSkycoinSignMessage(0, messageHash);
        signMessagePromise.then((signature) => {
          const checkMsgPromise = deviceWallet.devCheckMessageSignature(addresses[0], messageHash, signature);
          checkMsgPromise.then((strResponse) => {
            resolve(`Test success ${strResponse}`);
          }, (err) => {
            rejectPromise(err);
          });
        }, rejectPromise(reject));
      }, rejectPromise(reject));
    }, rejectPromise(reject));
  });
};

const sample2 = function () {
  return new Promise((resolve, reject) => {
    const setupPromise = setup();
    setupPromise.then(() => {
      const genAddrPromise = deviceWallet.devAddressGen(1);
      genAddrPromise.then((addresses) => {
        const messageHash = "01a9ef6c25271229ef9760e1536c3dc5ccf0ead7de93a64c12a01340670d87e9";
        const signMessagePromise = deviceWallet.devSkycoinSignMessage(0, messageHash);
        signMessagePromise.then((signature) => {
          const checkMsgPromise = deviceWallet.devCheckMessageSignature(addresses[0], messageHash, signature);
          checkMsgPromise.then((strResponse) => {
            resolve(`Test success ${strResponse}`);
          }, rejectPromise(reject));
        }, rejectPromise(reject));
      }, rejectPromise(reject));
    }, rejectPromise(reject));
  });
};

describe('Sign message', function () {
  if (deviceWallet.getDevice() === null) {
    console.log("Skycoin hardware NOT FOUND, using emulator");
    deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.EMULATOR);
    deviceWallet.setAutoPressButton(true, 'R');
  } else {
    console.log("Skycoin hardware is plugged in");
    deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.USB);
  }

  const testPromise = new Promise(function (resolve, reject) {
    setTimeout(function () {
      sample1().then(() => sample2()).
        then(() => {
          resolve(0);
        }).
        catch(reject);
    }, 200);
  });

  it('Should have a result equal to zero', function() {
    this.timeout(0);
    return testPromise.then(function(result) {
      assert.equal(result, 0);
    });
  });

});
