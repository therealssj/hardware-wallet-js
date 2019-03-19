const deviceWallet = require('../device-wallet');
const rejectPromise = require('../utils').rejectPromise;

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

describe('Apply Setting -> label', function () {
  it("Should apply device label settings", function() {
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
      then(function(features1) {
        const deviceLabel = 'My dev device';
        if (features1.label === deviceLabel) {
          return Promise.reject(new Error("Label should be different at test startup."));
        }
        return deviceWallet.devApplySettings(false, deviceLabel);
      }).
      then(deviceWallet.devGetFeatures).
      then(function(features2) {
        const deviceLabel = 'My dev device';
        if (deviceLabel === features2.label) {
          return "Setting applied as expected.";
        }
        return Promise.reject(new Error("Apply setting failed."));
      }).
      catch(function(err) {
        console.log(err);
        return Promise.reject(err);
      });
  });
});
