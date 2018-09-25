const HID = require('node-hid');
const messages = require('./protob/skycoin');
const dgram = require('dgram');
const scanf = require('scanf');

const dataBytesFromChunks = function(chunks) {
    const dataBytes = [];
    chunks.forEach((chunk, j) => {
        chunk.forEach((elt, i) => {
            dataBytes[(64 * j) + i] = elt;
        });
    });
    return dataBytes;
};

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
    console.log("Sending data", message, message.length);
    const nbChunks = message.length / 64;
    for (let i = 0; i < nbChunks; i += 1) {
        client.send(
            message.slice(64 * i, 64 * (i + 1)), 0, 64, 21324, '127.0.0.1',
            function(err, bytes) {
                if (err) {
                    throw err;
                }
                console.log("Sending data", bytes);
            }
        );
    }
};


const emulatorButtonRequestCallback = function(kind) {
    const dBytes = createButtonAckRequest();
    console.log("buttonRequestCallback!", dBytes);
    const cl = dgram.createSocket('udp4');
    cl.on('message', function(data, rinfo) {
        if (rinfo) {
            console.log(`server got: 
            ${data} from ${rinfo.address}:${rinfo.port}`);
        }
        console.log("User hit a button!");
        cl.close();
    });
    emulatorSend(cl, Buffer.from(dBytes));
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
    do {
        const u64pack = new Uint8Array(64);
        u64pack[0] = 63;
        u64pack.set(trezorMsg8.slice(63 * j, 63 * (j + 1)), 1);
        lengthToWrite -= 63;
        chunks[j] = u64pack;
        j += 1;
    } while (lengthToWrite > 0);
    return chunks;
};

const createButtonAckRequest = function() {
    const msgStructure = {};
    const msg = messages.ButtonAck.create(msgStructure);
    const buffer = messages.ButtonAck.encode(msg).finish();
    const chunks = makeTrezorMessage(
        buffer,
        messages.MessageType.MessageType_ButtonAck
    );
    console.log("createButtonAckRequest", chunks);
    return dataBytesFromChunks(chunks);
};

const createSetMnemonicRequest = function(mnemonic) {
    const msgStructure = {
        mnemonic
    };
    const msg = messages.SetMnemonic.create(msgStructure);
    const buffer = messages.SetMnemonic.encode(msg).finish();
    const chunks = makeTrezorMessage(
        buffer,
        messages.MessageType.MessageType_SetMnemonic
    );
    return dataBytesFromChunks(chunks);
};

const createWipeDeviceRequest = function() {
    const msgStructure = {};
    const msg = messages.WipeDevice.create(msgStructure);
    const buffer = messages.WipeDevice.encode(msg).finish();
    const chunks = makeTrezorMessage(
        buffer,
        messages.MessageType.MessageType_WipeDevice
    );
    return dataBytesFromChunks(chunks);
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
    return dataBytesFromChunks(chunks);
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
    return dataBytesFromChunks(chunks);
};

const createCheckMessageSignatureRequest = function(address, message, signature) {
    const msgStructure = {
        address,
        message,
        signature
    };
    const msg = messages.SkycoinCheckMessageSignature.create(msgStructure);
    const buffer = messages.SkycoinCheckMessageSignature.encode(msg).finish();
    const chunks = makeTrezorMessage(
        buffer,
        messages.MessageType.MessageType_SkycoinCheckMessageSignature
    );
    return dataBytesFromChunks(chunks);
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
    return dataBytesFromChunks(chunks);
};

const decodeButtonRequest = function(kind) {
    if (kind != messages.MessageType.MessageType_ButtonRequest) {
        console.error("Wrong message id!", messages.MessageType[kind]);
        return false;
    }
    console.log("ButtonRequest!");
    return true;
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

const decodeSignMessageAnswer = function(kind, dataBuffer) {
    let signature = "";
    decodeFailureAndPinCode(kind, dataBuffer);
    if (kind == messages.MessageType.
        MessageType_ResponseSkycoinSignMessage) {
        try {
            console.log("Data slice:", dataBuffer);
            const answer = messages.ResponseSkycoinSignMessage.
                            decode(dataBuffer);
            signature = answer.signedMessage;
        } catch (e) {
            console.error("Wire format is invalid", e);
        }
    }
    return signature;
};

const decodeAddressGenAnswer = function(kind, dataBuffer) {
    let addresses = [];
    decodeFailureAndPinCode(kind, dataBuffer);
    if (kind == messages.MessageType.
        MessageType_ResponseSkycoinAddress) {
        try {
            console.log(dataBuffer);
            const answer = messages.ResponseSkycoinAddress.
                            decode(dataBuffer);
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
                callback(this.kind, this.dataBuffer.slice(0, this.msgSize));
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
            callback(this.kind, this.dataBuffer.slice(0, this.msgSize));
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
            function(kind, dataBuffer) {
                const signature = decodeSignMessageAnswer(kind, dataBuffer);
                client.close();
                callback(kind, signature);
            }
        );
    });
    emulatorSend(client, Buffer.from(dataBytes));
};

const skycoinSignMessagePinCodeCallback = function(answerKind, dataBuffer, closeFunction) {
    console.log("After pinCode sending, got answer of kind:", messages.MessageType[answerKind]);
    closeFunction();
    const sign = decodeSignMessageAnswer(answerKind, dataBuffer);
    if (answerKind == messages.MessageType.
        MessageType_ResponseSkycoinSignMessage) {
        console.log(sign);
    }
};

const emulatorSkycoinSignMessagePinCode = function(addressN, message) {
    emulatorSkycoinSignMessage(addressN, message, function(kind, signature) {
        console.log("Signature generation kindly returned", messages.MessageType[kind]);
        if (kind == messages.MessageType.
                    MessageType_ResponseSkycoinSignMessage) {
            console.log(signature);
        }
        if (kind == messages.MessageType.
                    MessageType_PinMatrixRequest) {
            emulatorSendPinCodeRequest((answerKind, dataBuffer) => {
                skycoinSignMessagePinCodeCallback(answerKind, dataBuffer, client.close);
            });
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
            function(kind, dataBuffer) {
                const addresses = decodeAddressGenAnswer(kind, dataBuffer);
                client.close();
                callback(kind, addresses);
            }
        );
    });
    emulatorSend(client, Buffer.from(dataBytes));
};


const addressGenPinCodeCallback = function(answerKind, dataBuffer, closeFunction) {
        console.log("After pinCode sending, got answer of kind:", messages.MessageType[answerKind]);
        closeFunction();
        const addrs = decodeAddressGenAnswer(answerKind, dataBuffer);
        if (answerKind == messages.MessageType.
            MessageType_ResponseSkycoinAddress) {
            addrs.forEach((addr) => {
              console.log(addr);
            });
        }
};

const emulatorAddressGenPinCode = function(addressN, startIndex) {
    emulatorAddressGen(addressN, startIndex, function(kind, addresses) {
        console.log("Addresses generation kindly returned", messages.MessageType[kind]);
        if (kind == messages.MessageType.
                    MessageType_ResponseSkycoinAddress) {
            addresses.forEach((addr) => {
              console.log(addr);
            });
        }
        if (kind == messages.MessageType.
                    MessageType_PinMatrixRequest) {
            emulatorSendPinCodeRequest((answerKind, dataBuffer) => {
                addressGenPinCodeCallback(answerKind, dataBuffer, client.close);
            });
        }
    });
};

const emulatorCheckMessageSignature = function(address, message, signature) {
    const dataBytes = createCheckMessageSignatureRequest(address, message, signature);
    const client = dgram.createSocket('udp4');
    const bufferReceiver = new BufferReceiver();
    client.on('message', function(data, rinfo) {
        if (rinfo) {
            console.log(`server got: 
                ${data} from ${rinfo.address}:${rinfo.port}`);
        }
        bufferReceiver.receiveBuffer(
            data,
            function(kind, dataBuffer) {
                if (kind == messages.MessageType.
                    MessageType_Success) {
                    try {
                        console.log(dataBuffer);
                        const answer = messages.Success.
                                        decode(dataBuffer);
                        console.log("Address emiting that signature:", answer.message);
                        if (answer.message === address) {
                            console.log("Signature is correct");
                        }
                    } catch (e) {
                        console.error("Wire format is invalid", e);
                    }
                }
                client.close();
            }
        );
    });
    emulatorSend(client, Buffer.from(dataBytes));
};

const emulatorSetMnemonic = function(mnemonic) {
    const dataBytes = createSetMnemonicRequest(mnemonic);
    const client = dgram.createSocket('udp4');
    const bufferReceiver = new BufferReceiver();
    client.on('message', function(data, rinfo) {
        if (rinfo) {
            console.log(`server got: 
                ${data} from ${rinfo.address}:${rinfo.port}`);
        }
        bufferReceiver.receiveBuffer(
            data,
            function(kind) {
                client.close();
                if (decodeButtonRequest(kind)) {
                    emulatorButtonRequestCallback();
                }
            }
        );
    });
    emulatorSend(client, Buffer.from(dataBytes));
};

const emulatorWipeDevice = function() {
    const dataBytes = createWipeDeviceRequest();
    const client = dgram.createSocket('udp4');
    const bufferReceiver = new BufferReceiver();
    client.on('message', function(data, rinfo) {
        if (rinfo) {
            console.log(`server got: 
                ${data} from ${rinfo.address}:${rinfo.port}`);
        }
        bufferReceiver.receiveBuffer(
            data,
            function(kind) {
                client.close();
                if (decodeButtonRequest(kind)) {
                    emulatorButtonRequestCallback();
                }
            }
        );
    });
    emulatorSend(client, Buffer.from(dataBytes));
};

module.exports = {
    deviceAddressGen,
    emulatorAddressGen,
    emulatorAddressGenPinCode,
    emulatorCheckMessageSignature,
    emulatorSetMnemonic,
    emulatorSkycoinSignMessage,
    emulatorSkycoinSignMessagePinCode,
    emulatorWipeDevice,
    getDevice,
    makeTrezorMessage
};
