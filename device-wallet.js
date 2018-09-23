const HID = require('node-hid');
const messages = require('./protob/skycoin');
const dgram = require('dgram');


// Returns a handle to usbhid device
const getDevice = function() {
    const deviceInfo = HID.devices().find( function(d) {
        const isTeensy = d.manufacturer == "SatoshiLabs";
        return isTeensy;
    });
    if( deviceInfo ) {
        const device = new HID.HID( deviceInfo.path );
        return device;
    }
    return null;
};

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

const createAddressGenRequest = function(addressN, startIndex) {
    const msgStructure = {
        addressN,
        startIndex
    };
    const msg = messages.SkycoinAddress.create(msgStructure);
    const buffer = messages.SkycoinAddress.encode(msg).finish();
    const chunks = makeTrezorMessage(
        buffer,
        messages.MessageType.MessageType_SkycoinAddress
    );
    const dataBytes = [];
    chunks[0].forEach((elt, i) => {
        dataBytes[i] = elt;
    });
    return dataBytes;
};

// Sends Address generation request
// eslint-disable-next-line max-statements, max-lines-per-function
const deviceAddressGen = function(addressN, startIndex) {
    const dev = getDevice();
    if (dev === null) {
        console.error("Device not connected");
        return;
    }
    const dataBytes = createAddressGenRequest(addressN, startIndex);
    dev.write(dataBytes);

    // eslint-disable-next-line max-statements, max-lines-per-function
    dev.read(function(err, data) {
        if (err) {
            console.error(err);
            return;
        }
        const dv8 = new Uint8Array(data);
        const kind = new Uint16Array(dv8.slice(4, 5))[0];
        const msgSize = new Uint32Array(dv8.slice(8, 11))[0];

        const dataBuffer = new Uint8Array(2 + (64 * Math.ceil(msgSize / 64)));
        dataBuffer.set(dv8.slice(9));
        let bytesToGet = msgSize + 9 - 64;
        let i = 0;
        while (bytesToGet > 0) {
            dataBuffer.set(dev.readSync().slice(1), (63 * i) + 55);
            i += 1;
            bytesToGet -= 64;
        }
        console.log(
            "Received data", dataBuffer, " msg kind: ",
            messages.MessageType[kind],
            " size: ", msgSize, "buffer lenght: ", dataBuffer.byteLength
            );
        if (kind == messages.MessageType.MessageType_Failure) {
            try {
                const answer = messages.Failure.
                                decode(dataBufferArray);
                console.log(
                    "Failure message code",
                    answer.code, "message: ",
                    answer.message
                    );
            } catch (e) {
                console.error("Wire format is invalid");
            }
            dev.close();
        }

        if (kind == messages.MessageType.MessageType_ResponseSkycoinAddress) {
            try {
                console.log(dataBuffer.slice(0, msgSize));
                const answer = messages.ResponseSkycoinAddress.
                                decode(dataBuffer.slice(0, msgSize));
                console.log("Addresses", answer.addresses);
            } catch (e) {
                console.error("Wire format is invalid", e);
            }
            dev.close();
        }
    });
};

class BufferReceiver {
    constructor() {
        this.msgIndex = 0;
        this.msgSize = undefined;
        this.bytesToGet = undefined;
        this.kind = undefined;
        this.dataBuffer = undefined;
        // eslint-disable-next-line max-statements
        this.receiveBuffer = function(data, callback) {

            if (this.bytesToGet === undefined) {
                const dv8 = new Uint8Array(data);
                this.kind = new Uint16Array(dv8.slice(4, 5))[0];
                this.msgSize = new Uint32Array(dv8.slice(8, 11))[0];
                this.dataBuffer = new Uint8Array(64 * Math.ceil(this.msgSize / 64));
                this.dataBuffer.set(dv8.slice(9));
                this.bytesToGet = this.msgSize + 9 - 64;

                console.log(
                    "Received data", this.dataBuffer, " msg this.kind: ",
                    messages.MessageType[this.kind],
                    " size: ", this.msgSize, "buffer lenght: ",
                    this.dataBuffer.byteLength
                    );
                return;
            }

            this.dataBuffer.set(data.slice(1), (63 * this.msgIndex) + 55);
            this.msgIndex += 1;
            this.bytesToGet -= 64;

            console.log(
                "Received data", this.dataBuffer, " msg this.kind: ",
                messages.MessageType[this.kind],
                " size: ", this.msgSize, "buffer lenght: ",
                this.dataBuffer.byteLength
                );

            if (this.bytesToGet > 0) {
                return;
            }
            callback(this.kind, this.dataBuffer, this.msgSize);
        };
    }
}

// Sends Address generation request
// eslint-disable-next-line max-statements, max-lines-per-function
const emulatorAddressGen = function(addressN, startIndex) {
    const dataBytes = createAddressGenRequest(addressN, startIndex);
    const client = dgram.createSocket('udp4');
    const port = 21324;
    const bufferReceiver = new BufferReceiver();
    client.on('message', function(data, rinfo) {

        console.log('Received message from emulator', data.toString());
        if (rinfo) {
            console.log(`server got: 
                ${data} from ${rinfo.address}:${rinfo.port}`);
        }

        bufferReceiver.receiveBuffer(
            data,
            // eslint-disable-next-line max-statements
            function(kind, dataBuffer, msgSize) {
            if (kind == messages.MessageType.MessageType_Failure) {
                try {
                    const answer = messages.Failure.
                                    decode(dataBuffer);
                    console.log(
                        "Failure message code",
                        answer.code, "message: ",
                        answer.message
                        );
                } catch (e) {
                    console.error("Wire format is invalid");
                }
            }

            if (kind == messages.MessageType.
                MessageType_ResponseSkycoinAddress) {
                try {
                    console.log(dataBuffer.slice(0, msgSize));
                    const answer = messages.ResponseSkycoinAddress.
                                    decode(dataBuffer.slice(0, msgSize));
                    console.log("Addresses", answer.addresses);
                } catch (e) {
                    console.error("Wire format is invalid", e);
                }
            }

            client.close();
        }
        );

    });

    const message = Buffer.from(dataBytes);
    client.send(
        message, 0, message.length, port, '127.0.0.1',
        function(err, bytes) {
        if (err) {
            throw err;
        }
        console.log("Sending data", bytes);
    }
    );
};

module.exports = {
    deviceAddressGen,
    emulatorAddressGen,
    getDevice,
    makeTrezorMessage
};
