//@flow

import HID from "node-hid";
import Transport, { TransportError } from "./hw-transport/Transport";
import type {
  Observer,
  DescriptorEvent,
  Subscription
} from "./hw-transport/Transport";
import getDevices from "./getDevices";
import listenDevices from "./listenDevices";

// FIXME drop
type Defer<T> = {
  promise: Promise<T>,
  resolve: T => void,
  reject: any => void
};
function defer<T>(): Defer<T> {
  let resolve, reject;
  let promise = new Promise(function(success, failure) {
    resolve = success;
    reject = failure;
  });
  if (!resolve || !reject) throw new Error("defer() error"); // this never happens and is just to make flow happy
  return { promise, resolve, reject };
}

let listenDevicesDebounce = 500;
let listenDevicesPollingSkip = () => false;
let listenDevicesDebug = () => {};

/**
 * node-hid Transport implementation
 * @example
 * import TransportNodeHid from "@ledgerhq/hw-transport-node-u2f";
 * ...
 * TransportNodeHid.create().then(transport => ...)
 */
export default class TransportNodeHid extends Transport<string> {
  device: HID.HID;
  ledgerTransport: boolean;
  timeout: number;
  exchangeStack: Array<*>;

  constructor(
    device: HID.HID,
    ledgerTransport: boolean = true, // FIXME not used?
    timeout: number = 0 // FIXME not used?
  ) {
    super();
    this.device = device;
    this.ledgerTransport = ledgerTransport;
    this.timeout = timeout;
    this.exchangeStack = [];
  }

  static isSupported = (): Promise<boolean> =>
    Promise.resolve(typeof HID.HID === "function");

  static list = (): Promise<string[]> =>
    Promise.resolve(getDevices().map(d => d.path));

  static setListenDevicesDebounce = (delay: number) => {
    listenDevicesDebounce = delay;
  };

  static setListenDevicesPollingSkip = (conditionToSkip: () => boolean) => {
    listenDevicesPollingSkip = conditionToSkip;
  };

  static setListenDevicesDebug = (debug: boolean | ((log: string) => void)) => {
    listenDevicesDebug =
      typeof debug === "function"
        ? debug
        : debug
          ? (...log) => console.log("[listenDevices]", ...log)
          : () => {};
  };

  /**
   */
  static listen = (
    observer: Observer<DescriptorEvent<string>>
  ): Subscription => {
    let unsubscribed = false;
    Promise.resolve(getDevices()).then(devices => {
      // this needs to run asynchronously so the subscription is defined during this phase
      for (const device of devices) {
        if (!unsubscribed) {
          const descriptor: string = device.path;
          observer.next({ type: "add", descriptor, device });
        }
      }
    });
    const { events, stop } = listenDevices(
      listenDevicesDebounce,
      listenDevicesPollingSkip,
      listenDevicesDebug
    );

    const onAdd = device => {
      if (unsubscribed || !device) return;
      observer.next({ type: "add", descriptor: device.path, device });
    };
    const onRemove = device => {
      if (unsubscribed || !device) return;
      observer.next({ type: "remove", descriptor: device.path, device });
    };
    events.on("add", onAdd);
    events.on("remove", onRemove);
    function unsubscribe() {
      unsubscribed = true;
      events.removeListener("add", onAdd);
      events.removeListener("remove", onRemove);
      stop();
    }
    return { unsubscribe };
  };

  /**
   */
  static async open(path: string) {
    return Promise.resolve(new TransportNodeHid(new HID.HID(path)));
  }

  close(): Promise<void> {
    this.device.close();
    return Promise.resolve();
  }
}
