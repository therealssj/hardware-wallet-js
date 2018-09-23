const HID = require('node-hid');
const messages = require('./protob/skycoin');
const dgram = require('dgram');
const scanf = require('scanf');

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

const emulatorSend = function(client, message) {
    client.send(
        message, 0, message.length, 21324, '127.0.0.1',
        function(err, bytes) {
            if (err) {
                throw err;
            }
            console.log("Sending data", bytes);
        }
    );
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

const createSignMessageRequest = function(addressN, message) {
    const msgStructure = {
        addressN,
        message
    };
    const msg = messages.SkycoinSignMessage.create(msgStructure);
    const buffer = messages.SkycoinSignMessage.encode(msg).finish();
    const chunks = makeTrezorMessage(
        buffer,
        messages.MessageType.MessageType_SkycoinSignMessage
    );
    const dataBytes = [];
    chunks[0].forEach((elt, i) => {
        dataBytes[i] = elt;
    });
    return dataBytes;
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

const createSendPinCodeRequest = function(pin) {
    const msgStructure = {
        pin
    };
    const msg = messages.PinMatrixAck.create(msgStructure);
    const buffer = messages.PinMatrixAck.encode(msg).finish();
    const chunks = makeTrezorMessage(
        buffer,
        messages.MessageType.MessageType_PinMatrixAck
    );
    const dataBytes = [];
    chunks[0].forEach((elt, i) => {
        dataBytes[i] = elt;
    });
    return dataBytes;
};

const decodeFailureAndPinCode = function(kind, dataBuffer) {
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
        MessageType_PinMatrixRequest) {
        try {
            messages.PinMatrixRequest.decode(dataBuffer);
            console.log("Pin code required");
        } catch (e) {
            console.error("Wire format is invalid");
        }
    }
};

const decodeSignMessageAnswer = function(kind, dataBuffer, msgSize) {
    let signature = "";
    decodeFailureAndPinCode(kind, dataBuffer);
    if (kind == messages.MessageType.
        MessageType_ResponseSkycoinSignMessage) {
        try {
            console.log("Data slice:", dataBuffer.slice(0, msgSize));
            const answer = messages.ResponseSkycoinSignMessage.
                            decode(dataBuffer.slice(0, msgSize));
            console.log("Signature", answer.signedMessage);
            signature = answer.signedMessage;
        } catch (e) {
            console.error("Wire format is invalid", e);
        }
    }
    return signature;
};

// eslint-disable-next-line max-statements
const decodeAddressGenAnswer = function(kind, dataBuffer, msgSize) {
    let addresses = [];
    decodeFailureAndPinCode(kind, dataBuffer);
    if (kind == messages.MessageType.
        MessageType_ResponseSkycoinAddress) {
        try {
            console.log(dataBuffer.slice(0, msgSize));
            const answer = messages.ResponseSkycoinAddress.
                            decode(dataBuffer.slice(0, msgSize));
            console.log("Addresses", answer.addresses);
            addresses = answer.addresses;
        } catch (e) {
            console.error("Wire format is invalid", e);
        }
    }
    return addresses;
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
    // eslint-disable-next-line max-lines-per-function
    constructor() {
        this.msgIndex = 0;
        this.msgSize = undefined;
        this.bytesToGet = undefined;
        this.kind = undefined;
        this.dataBuffer = undefined;
        this.parseHeader = function(data) {
            const dv8 = new Uint8Array(data);
            this.kind = new Uint16Array(dv8.slice(4, 5))[0];
            this.msgSize = new Uint32Array(dv8.slice(8, 11))[0];
            this.dataBuffer = new Uint8Array(64 * Math.ceil(this.msgSize / 64));
            this.dataBuffer.set(dv8.slice(9));
            this.bytesToGet = this.msgSize + 9 - 64;

            console.log(
                "Received header", this.dataBuffer,
                " msg this.kind: ", messages.MessageType[this.kind],
                " size: ", this.msgSize,
                "buffer lenght: ", this.dataBuffer.byteLength,
                "\nRemaining bytesToGet:", this.bytesToGet
                );
        };
        // eslint-disable-next-line max-statements
        this.receiveBuffer = function(data, callback) {

            if (this.bytesToGet === undefined) {
                this.parseHeader(data);

                if (this.bytesToGet > 0) {
                    return;
                }
                callback(this.kind, this.dataBuffer, this.msgSize);
                return;
            }

            this.dataBuffer.set(data.slice(1), (63 * this.msgIndex) + 55);
            this.msgIndex += 1;
            this.bytesToGet -= 64;

            console.log(
                "Received data", this.dataBuffer, " msg kind: ",
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

const emulatorSendPinCodeRequest = function(pinCodeCallback) {
    console.log('Please input your pin code');
    const pinCode = scanf('%s');
    const dataBytes = createSendPinCodeRequest(pinCode);
    const client = dgram.createSocket('udp4');
    const bufferReceiver = new BufferReceiver();
    client.on('message', function(data, rinfo) {
        if (rinfo) {
            console.log(`server got: 
                ${data} from ${rinfo.address}:${rinfo.port}`);
        }

        bufferReceiver.receiveBuffer(
            data,
            pinCodeCallback
        );
    });
    emulatorSend(client, Buffer.from(dataBytes));
};

const emulatorSkycoinSignMessage = function(addressN, message, callback) {
    const dataBytes = createSignMessageRequest(addressN, message);
    const client = dgram.createSocket('udp4');
    const bufferReceiver = new BufferReceiver();
    client.on('message', function(data, rinfo) {
        if (rinfo) {
            console.log(`server got: 
                ${data} from ${rinfo.address}:${rinfo.port}`);
        }
        bufferReceiver.receiveBuffer(
            data,
            function(kind, dataBuffer, msgSize) {
                const signature = decodeSignMessageAnswer(kind, dataBuffer, msgSize);
                console.log(signature);
                client.close();
                callback(kind, signature);
            }
        );
    });
    emulatorSend(client, Buffer.from(dataBytes));
};

const emulatorSkycoinSignMessagePinCode = function(addressN, message) {
    emulatorSkycoinSignMessage(addressN, message, function(kind, signature) {
        console.log("Signature generation kindly returned", messages.MessageType[kind]);
        if (kind == messages.MessageType.
                    MessageType_ResponseSkycoinSignMessage) {
            console.log(signature);
        }
        const pinCodeCallback = function(answerKind, dataBuffer, msgSize) {
            console.log("After pinCode sending, got answer of kind:", messages.MessageType[answerKind]);
            client.close();
            const sign = decodeSignMessageAnswer(answerKind, dataBuffer, msgSize);
            if (answerKind == messages.MessageType.
                MessageType_ResponseSkycoinSignMessage) {
                console.log(sign);
            }
        };
        if (kind == messages.MessageType.
                    MessageType_PinMatrixRequest) {
            emulatorSendPinCodeRequest(pinCodeCallback);
        }
    });

};

// Sends Address generation request
const emulatorAddressGen = function(addressN, startIndex, callback) {
    const dataBytes = createAddressGenRequest(addressN, startIndex);
    const client = dgram.createSocket('udp4');
    const bufferReceiver = new BufferReceiver();
    client.on('message', function(data, rinfo) {
        if (rinfo) {
            console.log(`server got: 
                ${data} from ${rinfo.address}:${rinfo.port}`);
        }
        bufferReceiver.receiveBuffer(
            data,
            function(kind, dataBuffer, msgSize) {
                const addresses = decodeAddressGenAnswer(kind, dataBuffer, msgSize);
                client.close();
                callback(kind, addresses);
            }
        );
    });
    emulatorSend(client, Buffer.from(dataBytes));
};

// eslint-disable-next-line max-lines-per-function
const emulatorAddressGenPinCode = function(addressN, startIndex) {
    emulatorAddressGen(addressN, startIndex, function(kind, addresses) {
        console.log("Addresses generation kindly returned", messages.MessageType[kind]);
        if (kind == messages.MessageType.
                    MessageType_ResponseSkycoinAddress) {
            addresses.forEach((addr) => {
              console.log(addr);
            });
        }
        const pinCodeCallback = function(answerKind, dataBuffer, msgSize) {
                console.log("After pinCode sending, got answer of kind:", messages.MessageType[answerKind]);
                client.close();
                const addrs = decodeAddressGenAnswer(answerKind, dataBuffer, msgSize);
                if (answerKind == messages.MessageType.
                    MessageType_ResponseSkycoinAddress) {
                    addrs.forEach((addr) => {
                      console.log(addr);
                    });
                }
        };
        if (kind == messages.MessageType.
                    MessageType_PinMatrixRequest) {
            emulatorSendPinCodeRequest(pinCodeCallback);
        }
    });
};

module.exports = {
    deviceAddressGen,
    emulatorAddressGen,
    emulatorAddressGenPinCode,
    emulatorSkycoinSignMessage,
    emulatorSkycoinSignMessagePinCode,
    getDevice,
    makeTrezorMessage
};
