const HID = require('node-hid');
const messages = require('./protob/skycoin');
const dgram = require('dgram');
const scanf = require('scanf');

let deviceType = 0;

const setDeviceType = function(devType) {
    deviceType = devType;
};

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

class BufferReceiver {
    constructor() {
        this.msgIndex = 0;
        this.msgSize = undefined;
        this.bytesToGet = undefined;
        this.kind = undefined;
        this.dataBuffer = undefined;
    }

    parseHeader(data) {
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
    }

    // eslint-disable-next-line max-statements
    receiveBuffer(data, callback) {

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
        if (callback) {
            // eslint-disable-next-line callback-return
            callback(this.kind, this.dataBuffer.slice(0, this.msgSize));
        }
    }
}

DeviceTypeEnum = {
    'EMULATOR': 1,
    'USB': 2
};

class DeviceHandler {
    constructor(devType) {
        this.deviceType = devType;
        this.devHandle = this.getDeviceHandler();
    }

    getDeviceHandler() {
        switch (this.deviceType) {
        case DeviceTypeEnum.USB:
        {
            const dev = getDevice();
            if (dev === null) {
                throw new Error("Device not connected");
            }
            return dev;
        }
        case DeviceTypeEnum.EMULATOR:
        {
            const client = dgram.createSocket('udp4');
            return client;
        }
        default:
            throw new Error("Device type not defined");
        }
    }

    read(devReadCallback) {
        const bufferReceiver = new BufferReceiver();
        switch (this.deviceType) {
        case DeviceTypeEnum.USB:
            {
                const devHandle = this.devHandle;
                const devHandleCallback = function(err, data) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    bufferReceiver.receiveBuffer(data, devReadCallback);
                    if (bufferReceiver.bytesToGet > 0) {
                        console.log("Reading one more time", devHandle);
                        devHandle.read(devHandleCallback);
                    }
                };
                devHandle.read(devHandleCallback);
            }
            break;
        case DeviceTypeEnum.EMULATOR:
            this.devHandle.on('message', function(data, rinfo) {
                if (rinfo) {
                    console.log(`server got: 
                        ${data} from ${rinfo.address}:${rinfo.port}`);
                }
                bufferReceiver.receiveBuffer(data, devReadCallback);
            });
            break;
        default:
            throw new Error("Device type not defined");
        }
    }

    write(dataBytes) {
        switch (this.deviceType) {
        case DeviceTypeEnum.USB:
            this.devHandle.write(dataBytes);
            break;
        case DeviceTypeEnum.EMULATOR:
            emulatorSend(this.devHandle, Buffer.from(dataBytes));
            break;
        default:
            throw new Error("Device type not defined");
        }
    }

    close() {
        switch (this.deviceType) {
        case DeviceTypeEnum.USB:
            this.devHandle.close();
            break;
        case DeviceTypeEnum.EMULATOR:
            this.devHandle.close();
            break;
        default:
            throw new Error("Device type not defined");
        }
    }
}

const createButtonAckRequest = function() {
    const msgStructure = {};
    const msg = messages.ButtonAck.create(msgStructure);
    const buffer = messages.ButtonAck.encode(msg).finish();
    const chunks = makeTrezorMessage(
        buffer,
        messages.MessageType.MessageType_ButtonAck
    );
    return dataBytesFromChunks(chunks);
};

const createChangePinRequest = function(mnemonic) {
    const msgStructure = {
        mnemonic
    };
    const msg = messages.ChangePin.create(msgStructure);
    const buffer = messages.ChangePin.encode(msg).finish();
    const chunks = makeTrezorMessage(
        buffer,
        messages.MessageType.MessageType_ChangePin
    );
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

const emulatorButtonRequestCallback = function(kind, callback) {
    const dBytes = createButtonAckRequest();
    const cl = dgram.createSocket('udp4');
    cl.on('message', function(data, rinfo) {
        if (rinfo) {
            console.log(`server got: 
            ${data} from ${rinfo.address}:${rinfo.port}`);
        }
        console.log("User hit a button, calling: ", callback);
        cl.close();
        if (callback !== null && callback !== undefined) {
            // eslint-disable-next-line callback-return
            callback(data);
        }
    });
    emulatorSend(cl, Buffer.from(dBytes));
};

const deviceButtonRequestCallback = function(kind, callback) {
    const dataBytes = createButtonAckRequest();
    const dev = getDevice();
    if (dev === null) {
        console.error("Device not connected");
        return;
    }
    dev.read(function(err, data) {
        if (err) {
            console.error(err);
            return;
        }
        console.log("User hit a button, calling: ", callback);
        dev.close();
        if (callback !== null && callback !== undefined) {
            // eslint-disable-next-line callback-return
            callback(data);
        }
    });
    dev.write(dataBytes);
};

const addressGenPinCodeCallback = function(answerKind, dataBuffer, closeFunction) {
    console.log("After pinCode sending, got answer of kind:", messages.MessageType[answerKind]);
    if (closeFunction) {
        closeFunction();
    }
    const addrs = decodeAddressGenAnswer(answerKind, dataBuffer);
    if (answerKind == messages.MessageType.
        MessageType_ResponseSkycoinAddress) {
        addrs.forEach((addr) => {
          console.log(addr);
        });
    }
};

const skycoinSignMessagePinCodeCallback = function(answerKind, dataBuffer, closeFunction) {
    console.log("After pinCode sending, got answer of kind:", messages.MessageType[answerKind]);
    if (closeFunction) {
        closeFunction();
    }
    const sign = decodeSignMessageAnswer(answerKind, dataBuffer);
    if (answerKind == messages.MessageType.
        MessageType_ResponseSkycoinSignMessage) {
        console.log(sign);
    }
};

const devAddressGen = function(addressN, startIndex, callback) {
    const dataBytes = createAddressGenRequest(addressN, startIndex);
    const deviceHandle = new DeviceHandler(deviceType);
    const devReadCallback = function(kind, dataBuffer) {
        const addresses = decodeAddressGenAnswer(kind, dataBuffer);
        deviceHandle.close();
        callback(kind, addresses);
    };
    deviceHandle.read(devReadCallback);
    deviceHandle.write(dataBytes);
};

const devSendPinCodeRequest = function(pinCodeCallback) {
    console.log('Please input your pin code');
    const pinCode = scanf('%s');
    const dataBytes = createSendPinCodeRequest(pinCode);
    const deviceHandle = new DeviceHandler(deviceType);
    deviceHandle.read((answerKind, dataBuffer) => {
        pinCodeCallback(answerKind, dataBuffer);
        deviceHandle.close();
    });
    deviceHandle.write(dataBytes);
};

const devAddressGenPinCode = function(addressN, startIndex) {
    devAddressGen(addressN, startIndex, function(kind, addresses) {
        console.log("Addresses generation kindly returned", messages.MessageType[kind]);
        if (kind == messages.MessageType.
                    MessageType_ResponseSkycoinAddress) {
            addresses.forEach((addr) => {
              console.log(addr);
            });
        }
        if (kind == messages.MessageType.
                    MessageType_PinMatrixRequest) {
            devSendPinCodeRequest((answerKind, dataBuffer) => {
                addressGenPinCodeCallback(answerKind, dataBuffer);
            });
        }
    });
};

const devSkycoinSignMessage = function(addressN, message, callback) {
    const dataBytes = createSignMessageRequest(addressN, message);
    const deviceHandle = new DeviceHandler(deviceType);
    const devReadCallback = function(kind, dataBuffer) {
        const signature = decodeSignMessageAnswer(kind, dataBuffer);
        deviceHandle.close();
        callback(kind, signature);
    };
    deviceHandle.read(devReadCallback);
    deviceHandle.write(dataBytes);
};

const devSkycoinSignMessagePinCode = function(addressN, message) {
    devSkycoinSignMessage(addressN, message, function(kind, signature) {
        console.log("Signature generation kindly returned", messages.MessageType[kind]);
        if (kind == messages.MessageType.
                    MessageType_ResponseSkycoinSignMessage) {
            console.log(signature);
        }
        if (kind == messages.MessageType.
                    MessageType_PinMatrixRequest) {
            devSendPinCodeRequest(skycoinSignMessagePinCodeCallback);
        }
    });
};

const devCheckMessageSignature = function(address, message, signature) {
    const dataBytes = createCheckMessageSignatureRequest(address, message, signature);
    const deviceHandle = new DeviceHandler(deviceType);
    const devReadCallback = function(kind, dataBuffer) {
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
        deviceHandle.close();
    };
    deviceHandle.read(devReadCallback);
    deviceHandle.write(dataBytes);
};

const deviceWipeDevice = function() {
    const dataBytes = createWipeDeviceRequest();
    const dev = getDevice();
    if (dev === null) {
        console.error("Device not connected");
        return;
    }
    const bufferReceiver = new BufferReceiver();
    const devReadCallback = function(err, data) {
        if (err) {
            console.error(err);
            return;
        }
        bufferReceiver.receiveBuffer(
            data,
            function(kind) {
                dev.close();
                if (decodeButtonRequest(kind)) {
                    deviceButtonRequestCallback();
                }
            }
        );
        if (bufferReceiver.bytesToGet > 0) {
            dev.read(devReadCallback);
        }
    };
    dev.read(devReadCallback);
    dev.write(dataBytes);
};

const deviceSetMnemonic = function(mnemonic) {
    const dataBytes = createSetMnemonicRequest(mnemonic);
    const dev = getDevice();
    if (dev === null) {
        console.error("Device not connected");
        return;
    }
    const bufferReceiver = new BufferReceiver();
    const devReadCallback = function(err, data) {
        if (err) {
            console.error(err);
            return;
        }
        bufferReceiver.receiveBuffer(
            data,
            function(kind) {
                dev.close();
                if (decodeButtonRequest(kind)) {
                    deviceButtonRequestCallback();
                }
            }
        );
        if (bufferReceiver.bytesToGet > 0) {
            dev.read(devReadCallback);
        }
    };
    dev.read(devReadCallback);
    dev.write(dataBytes);
};

// eslint-disable-next-line max-statements, max-lines-per-function
const deviceChangePin = function() {
    const dataBytes = createChangePinRequest();
    const dev = getDevice();
    if (dev === null) {
        console.error("Device not connected");
        return;
    }
    const bufferReceiver = new BufferReceiver();
    const devReadCallback = function(err, data) {
        if (err) {
            console.error(err);
            return;
        }
        // eslint-disable-next-line max-statements
        const pinCodeMatrixCallback = function(receivedData) {
            const dv8 = new Uint8Array(receivedData);
            const kind = new Uint16Array(dv8.slice(4, 5))[0];
            console.log("pinCodeMatrixCallback kind:", kind);
            if (kind == messages.MessageType.MessageType_PinMatrixRequest) {
                console.log('Please input your pin code');
                const pinCode = scanf('%s');
                dBytes = createSendPinCodeRequest(pinCode);
                const device = getDevice();
                if (device === null) {
                    console.error("Device not connected");
                    return;
                }
                device.read(function(deverr, dta) {
                    if (deverr) {
                        console.error(deverr);
                        return;
                    }
                    device.close();
                    pinCodeMatrixCallback(dta);
                });
                device.write(dBytes);
            }
        };
        bufferReceiver.receiveBuffer(
            data,
            function(kind) {
                dev.close();
                if (decodeButtonRequest(kind)) {
                    deviceButtonRequestCallback(kind, pinCodeMatrixCallback);
                }
            }
        );
        if (bufferReceiver.bytesToGet > 0) {
            dev.read(devReadCallback);
        }
    };
    dev.read(devReadCallback);
    dev.write(dataBytes);
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

const emulatorChangePin = function() {
    const dataBytes = createChangePinRequest();
    const client = dgram.createSocket('udp4');
    const bufferReceiver = new BufferReceiver();
    client.on('message', function(data, rinfo) {
        if (rinfo) {
            console.log(`server got: 
                ${data} from ${rinfo.address}:${rinfo.port}`);
        }
        const pinCodeMatrixCallback = function(receivedData) {
            const dv8 = new Uint8Array(receivedData);
            const kind = new Uint16Array(dv8.slice(4, 5))[0];
            console.log("pinCodeMatrixCallback kind:", kind);
            if (kind == messages.MessageType.MessageType_PinMatrixRequest) {
                console.log('Please input your pin code');
                const pinCode = scanf('%s');
                dBytes = createSendPinCodeRequest(pinCode);
                const cl = dgram.createSocket('udp4');
                cl.on('message', function(dta, info) {
                    if (info) {
                        console.log(`server got: 
                            ${dta} from ${info.address}:${info.port}`);
                    }
                    cl.close();
                    pinCodeMatrixCallback(dta);
                });
                emulatorSend(cl, Buffer.from(dBytes));
            }
        };
        bufferReceiver.receiveBuffer(
            data,
            function(kind) {
                client.close();
                if (decodeButtonRequest(kind)) {
                    emulatorButtonRequestCallback(kind, pinCodeMatrixCallback);
                }
            }
        );
    });
    emulatorSend(client, Buffer.from(dataBytes));
};

module.exports = {
    DeviceTypeEnum,
    devAddressGen,
    devAddressGenPinCode,
    devCheckMessageSignature,
    devSkycoinSignMessagePinCode,
    deviceChangePin,
    deviceSetMnemonic,
    deviceWipeDevice,
    emulatorChangePin,
    emulatorSetMnemonic,
    emulatorWipeDevice,
    getDevice,
    makeTrezorMessage,
    setDeviceType
};
