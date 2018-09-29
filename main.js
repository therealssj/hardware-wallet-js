const deviceWallet = require('./device-wallet');

if( deviceWallet.getDevice() === null ) {
  console.log("Skycoin hardware NOT FOUND, using emulator");
  deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.EMULATOR);
  deviceWallet.emulatorChangePin();
} else {
  console.log("Skycoin hardware is plugged in");
  deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.USB);
  deviceWallet.deviceChangePin();
}

deviceWallet.devAddressGenPinCode(2, 3);
deviceWallet.devSkycoinSignMessagePinCode(3, "Hello World!");
deviceWallet.devCheckMessageSignature(
  "2NckPkQRQFa5E7HtqDkZmV1TH4HCzR2N5J6",
  "Hello World!",
  "NGV8kPw8FZuYFWYzMa3oHJhHmW4WPTnSUUaEFYBvyS8Te8WxrHDuDdbgVqFkdEg5FzE5QDdwMQcXcWMY4enJhkDE"
);
deviceWallet.devSetMnemonic("cloud flower upset remain green metal below cup stem infant art thank");
deviceWallet.devWipeDevice();
