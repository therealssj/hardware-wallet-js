const deviceWallet = require('./device-wallet');

if( deviceWallet.getDevice() === null ) {
  console.log("Skycoin hardware NOT FOUND, using emulator");
  deviceWallet.emulatorAddressGenPinCode(2, 3);
  deviceWallet.emulatorSkycoinSignMessagePinCode(3, "Hello World!");
  deviceWallet.emulatorCheckMessageSignature(
    "2NckPkQRQFa5E7HtqDkZmV1TH4HCzR2N5J6",
    "Hello World!",
    "NGV8kPw8FZuYFWYzMa3oHJhHmW4WPTnSUUaEFYBvyS8Te8WxrHDuDdbgVqFkdEg5FzE5QDdwMQcXcWMY4enJhkDE"
  );
  deviceWallet.emulatorSetMnemonic("cloud flower upset remain green metal below cup stem infant art thank");
  deviceWallet.emulatorWipeDevice();
  deviceWallet.emulatorChangePin();
} else {
  console.log("Skycoin hardware is plugged in");
  deviceWallet.deviceAddressGenPinCode(2, 3);
  deviceWallet.deviceSkycoinSignMessagePinCode(3, "Hello World!");
  deviceWallet.deviceCheckMessageSignature(
    "2NckPkQRQFa5E7HtqDkZmV1TH4HCzR2N5J6",
    "Hello World!",
    "NGV8kPw8FZuYFWYzMa3oHJhHmW4WPTnSUUaEFYBvyS8Te8WxrHDuDdbgVqFkdEg5FzE5QDdwMQcXcWMY4enJhkDE"
  );
  deviceWallet.deviceSetMnemonic("cloud flower upset remain green metal below cup stem infant art thank");
  deviceWallet.deviceWipeDevice();
}
