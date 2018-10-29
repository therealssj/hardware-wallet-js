// @flow
import HID from "node-hid";

const filterInterface = device => 
  ["win32", "darwin"].includes(process.platform)
    ? // $FlowFixMe bug in HID flow def
      device.usagePage === 65280
    : device.interface === 0;

export default function getDevices(): Array<*> {
  // $FlowFixMe bug in HID flow def
  return HID.devices().filter(filterInterface);
}

console.log(getDevices());
