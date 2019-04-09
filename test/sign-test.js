const deviceWallet = require('../device-wallet');
const utils = require('../utils');
const rejectPromise = utils.rejectPromise;
const timeout = utils.timeout;

const setup = function () {
  return new Promise((resolve, reject) => {
    deviceWallet.devWipeDevice().
      then(() => deviceWallet.devGenerateMnemonic(12, false)).
      then(() => {
        resolve("Set up done.");
      }, (msg) => {
        console.log(msg);
        reject(new Error("setup failed"));
      });
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

  const testSignMessageHash = function (messageHash) {
    return setup().
      then(() => deviceWallet.devAddressGen(1)).
      then(function (addresses) {
        return deviceWallet.devSkycoinSignMessage(0, messageHash).
          then(function (signature) {
            return deviceWallet.devCheckMessageSignature(addresses[0], messageHash, signature);
          }).
          then(function (strResponse) {
            return Promise.resolve(`Test success ${strResponse}`);
          });
      }).
      catch(rejectPromise());
  };

  it('Verify that address signed hash', function() {
    this.timeout(0);
    return timeout(200).
      then(() => testSignMessageHash("181bd5656115172fe81451fae4fb56498a97744d89702e73da75ba91ed5200f9")).
      then(() => testSignMessageHash("01a9ef6c25271229ef9760e1536c3dc5ccf0ead7de93a64c12a01340670d87e9"));
  });

});
