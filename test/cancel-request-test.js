const deviceWallet = require('../device-wallet');
const rejectPromise = require('../utils').rejectPromise;

const setup = function () {
  return new Promise(function(resolve, reject) {
    deviceWallet.devWipeDevice().
      then(
        () => {
          resolve('Set up done');
        },
        rejectPromise(reject)
      );
  });
};

describe('Cancel Request test', function () {
  it("Should cancel pending requests", function(done) {
    this.timeout(0);
    if (deviceWallet.getDevice() === null) {
      console.log("Skycoin hardware NOT FOUND, using emulator");
      deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.EMULATOR);
    } else {
      console.log("Skycoin hardware is plugged in");
      deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.USB);
    }

    setTimeout(function() {
      deviceWallet.devCancelRequest().then(() => {
        done();
      });
    }, 2000);

    setup().
      then(() => deviceWallet.devChangePin).
      then(() => {
        done(new Error('The Cancel Request is not working'));
      }).
      catch(() => {
        done();
      });
  });
});
