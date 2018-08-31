var HID = require('node-hid');
var protobuf = require("protobufjs");
var messages = require('./protob/skycoin');

var devices = HID.devices();

// eslint-disable-next-line no-console
console.log(devices);

var deviceInfo = HID.devices().find( function(d) {
    var isTeensy = d.manufacturer == "SatoshiLabs";
    return isTeensy;
});


function makeTrezorMessage(buffer, msgId) {
  u8Array = new Uint8Array(buffer);
  var trezorMsg = new ArrayBuffer(10 + u8Array.byteLength - 1);
  var dv = new DataView(trezorMsg);
  dv.setUint8(0, 35); // #
  dv.setUint8(1, 35); // #
  dv.setUint16(2, msgId);
  dv.setUint32(4, u8Array.byteLength);
  dv.setUint8(8, 10); // '\n'
  var trezorMsg8 = new Uint8Array(trezorMsg);
  trezorMsg8.set(u8Array.slice(1), 9);

  var lengthToWrite = u8Array.byteLength;
  var chunks = [];
  var j = 0;
  while (lengthToWrite > 0) {
    u64pack = new Uint8Array(64);
    u64pack[0] = 63;
    u64pack.set(trezorMsg8.slice(63*j, 63*(j+1)), 1);
    lengthToWrite -= 63;
    chunks[j] = u64pack;
    j++;

  }
  console.log(chunks)
  return chunks
}

if( deviceInfo ) {
  var device = new HID.HID( deviceInfo.path );
  // eslint-disable-next-line no-console
  console.log("Skycoin hardware is plugged in");
  device.on("data", function(data) {
    // eslint-disable-next-line no-console
    console.log("Received data", data);
    // device.write([0x00, 0x01, 0x01, 0x05, 0xff, 0xff]);
  });
} else {
  // eslint-disable-next-line no-console
  console.log("404 Skycoin hardware NOT FOUND");
  var failMsg = new messages.Failure.create( { "message": "Ahyo"});
  let buffer = messages.Failure.encode(failMsg).finish();
  console.log(`buffer = ${Array.prototype.toString.call(buffer)}`);
  makeTrezorMessage(buffer, 3);
}
