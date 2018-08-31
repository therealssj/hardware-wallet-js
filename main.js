const HID = require('node-hid');
const messages = require('./protob/skycoin');
const deviceWallet = require('./device-wallet');

const deviceInfo = HID.devices().find( function(d) {
    const isTeensy = d.manufacturer == "SatoshiLabs";
    return isTeensy;
});

if( deviceInfo ) {
  const device = new HID.HID( deviceInfo.path );
  // eslint-disable-next-line no-console
  console.log("Skycoin hardware is plugged in");
  device.on("data", function(data) {
    // eslint-disable-next-line no-console
    console.log("Received data", data);
  });
} else {
  // eslint-disable-next-line no-console
  console.log("404 Skycoin hardware NOT FOUND");
  const failMsg = messages.Failure.create( {"message": "Ahyo"} );
  const buffer = messages.Failure.encode(failMsg).finish();
  const chunks = deviceWallet.makeTrezorMessage(buffer, 3);
  // eslint-disable-next-line no-console
  console.log(chunks);
}
