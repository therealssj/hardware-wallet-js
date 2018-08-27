var HID = require('node-hid');

var devices = HID.devices();

console.log(devices);

var devices = HID.devices();
var deviceInfo = devices.find( function(d) {
    var isTeensy = d.manufacturer == "SatoshiLabs";
    return isTeensy;
});
if( deviceInfo ) {
  var device = new HID.HID( deviceInfo.path );
  // ... use device
  console.log("Skycoin hardware is plugged in");
} else {
  console.log("404 Skycoin hardware NOT FOUND");
}
