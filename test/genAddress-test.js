const deviceWallet = require('../device-wallet');
const utils = require('../utils');
const assert = require('chai').assert;
const rejectPromise = utils.rejectPromise;
const pinCodeReader = utils.pinCodeReader;
const wordReader = utils.wordReader;

const setup = function () {
  return new Promise((resolve, reject) => {
    const wipePromise = deviceWallet.devWipeDevice();
    wipePromise.then(() => {
      const genMneonicPromise = deviceWallet.devGenerateMnemonic(12, false);
      genMneonicPromise.then(() => resolve("Set up done."), rejectPromise(reject));
    }, rejectPromise(reject));
  });
};

describe('Generate Address properly', function() {
  if (deviceWallet.getDevice() === null) {
    console.log("Skycoin hardware NOT FOUND, using emulator");
    deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.EMULATOR);
    deviceWallet.setAutoPressButton(true, 'R');
  } else {
    console.log("Skycoin hardware is plugged in");
    deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.USB);
  }

  it('Should match with known addresses', function() {
    this.timeout(0);
    return setup().
      then(() => deviceWallet.devAddressGen(12, 0, false, pinCodeReader, wordReader)).
      then((addr) => {
        const initLower = 'a'.codePointAt(0);
        const finLower = 'z'.codePointAt(0);

        const initUpper = 'A'.codePointAt(0);
        const finUpper = 'Z'.codePointAt(0);

        const initNumber = '0'.codePointAt(0);
        const finNumber = '9'.codePointAt(0);

        console.log('ADDR: ', addr);
        for (let i = 0, maxi = addr.length; i < maxi; i += 1) {
          for (let j = 0, maxj = addr[i].length; j < maxj; j += 1) {
            const code = addr[i][j].codePointAt(0);
            assert.isTrue((initLower <= code && code <= finLower) ||
              (initUpper <= code && code <= finUpper) ||
              (initNumber <= code && code <= finNumber));
          }
        }
      });
  });

});

