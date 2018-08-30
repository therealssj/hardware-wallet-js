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


function makeTrezorMessage(data, msgId) {
    console.log(msgId, data.byteLength);

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
  console.log(buffer);
  console.log(`buffer = ${Array.prototype.toString.call(buffer)}`);
  makeTrezorMessage(buffer, 1);
}
