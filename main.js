const deviceWallet = require('./device-wallet');
const DeviceDetectionEvent = require('./device-detection-lib/device-detection/DeviceEventObserver');
const transportNodeHid = require('./device-detection-lib/device-detection/TransportNodeHid');

console.log(deviceDetectionEvent);
const observer = new DeviceDetectionEvent();
transportNodeHid.listen(observer);

// eslint-disable-next-line max-lines-per-function
const sandbox = function() {
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
  const addrPromise = deviceWallet.devAddressGen(2, 3);
  addrPromise.then(
    (addresses) => {
      console.log("Address Promise resolved", addresses);
      const signPromise = deviceWallet.devSkycoinSignMessage(3, "Hello World!");
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
            const wipePromise = deviceWallet.devWipeDevice();
            wipePromise.then(
              (msg) => {
                console.log(msg);
                const setMnemonicPromise =
                  deviceWallet.devSetMnemonic("cloud flower upset remain green metal below cup stem infant art thank");
                setMnemonicPromise.then(
                  (mnemonicMsg) => {
                    console.log(mnemonicMsg);
                    const changePinPromise = deviceWallet.devChangePin();
                    changePinPromise.then(
                    () => {
                      console.log("Finally change pin success");
                    },
                    rejectPromise
                    );
                  },
                  rejectPromise
                  );
              },
              rejectPromise
              );
          },
          rejectPromise
          );
      },
      rejectPromise
      );
    },
    rejectPromise
  );
};
sandbox();
