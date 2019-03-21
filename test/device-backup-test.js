const deviceWallet = require('../device-wallet');
utils = require('../utils');
const pinCodeReader = utils.pinCodeReader("Device backup test");

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

    return deviceWallet.devWipeDevice().
      then(function() {
        return deviceWallet.devSetMnemonic("cloud flower upset remain green metal below cup stem infant art thank");
      }).
      then(function() {
        return deviceWallet.devBackupDevice(pinCodeReader);
      });

  });

});
