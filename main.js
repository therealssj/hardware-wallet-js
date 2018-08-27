var HID = require('node-hid');

var devices = HID.devices();

// eslint-disable-next-line no-console
console.log(devices);

var deviceInfo = HID.devices().find( function(d) {
    var isTeensy = d.manufacturer == "SatoshiLabs";
    return isTeensy;
});

if( deviceInfo ) {
  // ... create device object like this: new HID.HID( deviceInfo.path );
  // eslint-disable-next-line no-console
  console.log("Skycoin hardware is plugged in");
} else {
  // eslint-disable-next-line no-console
  console.log("404 Skycoin hardware NOT FOUND");
}
