const deviceWallet = require('./device-wallet');

if( deviceWallet.getDevice() === null ) {
  console.log("Skycoin hardware NOT FOUND, using emulator");
  deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.EMULATOR);
} else {
  console.log("Skycoin hardware is plugged in");
  deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.USB);
}

const rejectPromise = function(msg) {
    console.log("Promise rejected", msg);
};
const addrPromise = deviceWallet.devAddressGenPinCode(2, 3);
addrPromise.then(
  (addresses) => {
    console.log("Address Promise resolved", addresses);
    const signPromise = deviceWallet.devSkycoinSignMessagePinCode(3, "Hello World!");
    signPromise.then(
      (signature) => {
      console.log("Signature promise resolved", signature);
      const checkSignPromise = deviceWallet.devCheckMessageSignature(
        "2NckPkQRQFa5E7HtqDkZmV1TH4HCzR2N5J6",
        "Hello World!",
        "NGV8kPw8FZuYFWYzMa3oHJhHmW4WPTnSUUaEFYBvyS8Te8WxrHDuDdbgVqFkdEg5FzE5QDdwMQcXcWMY4enJhkDE"
      );
      checkSignPromise.then(
        (check) => {
          console.log(check);
          deviceWallet.devWipeDevice();
        },
        rejectPromise
        );
    },
    rejectPromise
    );
  },
  rejectPromise
);
deviceWallet.devSetMnemonic("cloud flower upset remain green metal below cup stem infant art thank");
deviceWallet.devChangePin();
