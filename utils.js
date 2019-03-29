const assert = require('chai').assert;
const deviceWallet = require('./device-wallet');

const rejectPromise = function (reject) {
  return function(msg) {
    console.log("Promise rejected", msg);
    if (reject) {
      reject(new Error(msg));
    }
    return Promise.reject(new Error(msg));
  };
};

const wordReader = function () {
  return new Promise((resolve) => {
    console.log("Inside wordReader callback, please input word: ");
    const word = scanf('%s');
    resolve(word);
  });
};

const pinCodeReader = function (msg) {
  return function() {
    return new Promise((resolve, reject) => {
      console.log(`Enter pinCodeReader : ${msg}`);
      const pinCode = scanf('%s');
      if (pinCode.length != 4) {
        reject(new Error("Pin code mismatch"));
        return;
      }
      resolve(pinCode);
    });
  };
};

const deviceSetup = function () {
  return new Promise((resolve, reject) => {
    deviceWallet.devWipeDevice().
      then(() => {
        resolve("Device cleaned up. Setup done.");
      }, rejectPromise(reject));
  });
};

const testNotImplementedInFirmware = function(promise) {
  return promise.
    then(() => {
      reject(new Error('Expected to fail. Should be not implemented in firmware.'));
    }).
    catch((err) => err.message).
    then(function(result) {
      assert.equal(result, "Error: Not implement");
    });
};

const timeout = function(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ms), ms);
  });
};

module.exports = {
  deviceSetup,
  pinCodeReader,
  rejectPromise,
  testNotImplementedInFirmware,
  timeout,
  wordReader
};
