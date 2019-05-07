const deviceWallet = require('../device-wallet');
const rejectPromise = require('../utils').rejectPromise;
const assert = require('chai').assert;

const setup = function () {
  return new Promise(function(resolve, reject) {
    deviceWallet.devWipeDevice().
      then(
        () => {
          resolve('Set up done');
        },
        (msg) => {
          rejectPromise("setup failed");
          reject(msg);
        }
      );
  });
};

describe('Get features', function () {
  it("Should have RDP level equal to 4 (emulator)", function() {
    this.timeout(0);
    if (deviceWallet.getDevice() === null) {
      console.log("Skycoin hardware NOT FOUND, using emulator");
      deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.EMULATOR);
      deviceWallet.setAutoPressButton(true, 'R');
    } else {
      console.log("Skycoin hardware is plugged in");
      deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.USB);
    }

    return setup().
      then(deviceWallet.devGetFeatures).
      then(function(features) {
        console.log(features);
        assert.equal(features.firmwareFeatures, 4);
      }).
      catch(function(err) {
        console.log(err);
        return Promise.reject(err);
      });
  });
});
