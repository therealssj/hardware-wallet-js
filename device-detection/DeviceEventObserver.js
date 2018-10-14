import TransportNodeHid from "./TransportNodeHid"

export default class DeviceEventObserver {
    constructor() {
        this.observers = [];
    }
    next(obj) { 
        console.log(obj.path);
        if (obj.type === 'add' && obj.device.manufacturer === 'SatoshiLabs') {
            console.log('Boom!');
        }
        if (obj.type === 'remove') {
            console.log('Bam!');
        }
    }
}