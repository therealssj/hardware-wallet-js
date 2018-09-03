const messages = require('./protob/skycoin');
const deviceWallet = require('./device-wallet');

if( deviceWallet.deviceAddressGen() === null ) {
  // eslint-disable-next-line no-console
  console.log("404 Skycoin hardware NOT FOUND");
  const failMsg = messages.Failure.create( {"message": "Ahyo"} );
  const buffer = messages.Failure.encode(failMsg).finish();
  const chunks = deviceWallet.makeTrezorMessage(buffer, 3);
  if (chunks.length > 0) {
    // eslint-disable-next-line no-console
    console.log(chunks[0].toString());
  }
} else {
  // eslint-disable-next-line no-console
  console.log("Skycoin hardware is plugged in");
  // eslint-disable-next-line no-console
  console.log(deviceWallet.deviceAddressGen(0, 0));
}
