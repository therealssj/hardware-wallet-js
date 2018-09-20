const deviceWallet = require('./device-wallet');

/*
if( deviceWallet.getDevice() === null ) {
  // eslint-disable-next-line no-console
  console.log("404 Skycoin hardware NOT FOUND");
} else {
  // eslint-disable-next-line no-console
  console.log("Skycoin hardware is plugged in");
  deviceWallet.deviceAddressGen(2, 3);
}
*/
deviceWallet.emulatorAddressGen(2, 3);