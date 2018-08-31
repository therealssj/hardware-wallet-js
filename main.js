const HID = require('node-hid');
const messages = require('./protob/skycoin');
const ArrayBuffer = require('ArrayBuffer');
const Uint8Array = require('Uint8Array');
const DataView = require('DataView');

const devices = HID.devices();

// eslint-disable-next-line no-console
console.log(devices);

const deviceInfo = HID.devices().find( function(d) {
    const isTeensy = d.manufacturer == "SatoshiLabs";
    return isTeensy;
});

// Prepares buffer containing message to device
// eslint-disable-next-line max-statements
const makeTrezorMessage = function(buffer, msgId) {
  const u8Array = new Uint8Array(buffer);
  const trezorMsg = new ArrayBuffer(10 + u8Array.byteLength - 1);
  const dv = new DataView(trezorMsg);
  // Adding the '##' at the begining of the header
  dv.setUint8(0, 35);
  dv.setUint8(1, 35);
  dv.setUint16(2, msgId);
  dv.setUint32(4, u8Array.byteLength);
  // Adding '\n' at the end of the header
  dv.setUint8(8, 10);
  const trezorMsg8 = new Uint8Array(trezorMsg);
  trezorMsg8.set(u8Array.slice(1), 9);

  let lengthToWrite = u8Array.byteLength;
  const chunks = [];
  let j = 0;
  while (lengthToWrite > 0) {
    const u64pack = new Uint8Array(64);
    u64pack[0] = 63;
    u64pack.set(trezorMsg8.slice(63 * j, 63 * (j + 1)), 1);
    lengthToWrite -= 63;
    chunks[j] = u64pack;
    j += 1;
  }
  return chunks;
};

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
  const chunks = makeTrezorMessage(buffer, 3);
  // eslint-disable-next-line no-console
  console.log(chunks);
}
