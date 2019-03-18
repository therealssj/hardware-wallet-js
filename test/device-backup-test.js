const deviceWallet = require('../device-wallet');

const pinCodeReader = function() {
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

describe('Device Backup test', function() {

  it('Should create a backup correctly', function() {

    this.timeout(0);

    if (deviceWallet.getDevice() === null) {
      console.log("Skycoin hardware NOT FOUND, using emulator");
      deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.EMULATOR);
      deviceWallet.setAutoPressButton(true, 'R');
    } else {
        console.log("Skycoin hardware is plugged in");
        deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.USB);
    }

    return deviceWallet.devWipeDevice()
      .then(function() {
          return deviceWallet.devSetMnemonic("cloud flower upset remain green metal below cup stem infant art thank");
      })
      .then(function() {
          return deviceWallet.devBackupDevice(pinCodeReader);
      });

  });

});