'use strict';
const Suite = require('node-test');
const messages = require('../protob/js/skycoin');
const deviceWallet = require('../device-wallet');

const suite = new Suite('Device wallet buffer creation');

suite.test('Fail message', t => {
    const msg = messages.Failure.create( {"message": "Ahyo"} );
    const buffer = messages.Failure.encode(msg).finish();
    const chunks = deviceWallet.makeTrezorMessage(buffer, messages.MessageType.MessageType_Failure);
    t.equal(chunks.length, 1);
    t.equal(chunks[0].toString(), 
        new Uint8Array([63, 35, 35, 0, 3, 0, 0, 0, 6, 10, 4, 65, 104, 121, 
            111, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
            0, 0, 0, 0, 0, 0, 0, 0, 0 ]).toString());
});

suite.test('Success message', t => {
    const msg = messages.Success.create( {"message": "Congratulations!"} );
    const buffer = messages.Success.encode(msg).finish();
    const chunks = deviceWallet.makeTrezorMessage(buffer, messages.MessageType.MessageType_Success);
    t.equal(chunks.length, 1);
    t.equal(chunks[0].toString(), 
        new Uint8Array([63, 35, 35, 0, 2, 0, 0, 0, 18, 10, 16, 67, 111, 
            110, 103, 114, 97, 116, 117, 108, 97, 116, 105, 111, 110, 
            115, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
            0, 0]).toString());
});

suite.test('SkycoinAddress message', t => {
    const msg = messages.SkycoinAddress.create( {"addressN": 0, "startIndex": 0} );
    const buffer = messages.SkycoinAddress.encode(msg).finish();
    const chunks = deviceWallet.makeTrezorMessage(buffer, messages.MessageType.MessageType_SkycoinAddress);
    t.equal(chunks.length, 1);
    t.equal(chunks[0].toString(), 
        new Uint8Array([63, 35, 35, 0, 114, 0, 0, 0, 4, 10, 0, 16, 0, 0,
         0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
         0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
         0, 0, 0, 0, 0, 0, 0, 0]).toString());
});

suite.test('ResponseSkycoinAddress message', t => {
    const msg = messages.ResponseSkycoinAddress.create( {
        "addresses": ["2NckPkQRQFa5E7HtqDkZmV1TH4HCzR2N5J6", "2ARhYQsMmMZuw5LPmZQvyWoTm1VUH8kSZ14"]
    } );
    const buffer = messages.ResponseSkycoinAddress.encode(msg).finish();
    t.equal(buffer.byteLength, 74);
    t.equal(buffer.toString(), new Buffer([
            0x0a, 0x23, 0x32, 0x4e, 0x63, 0x6b, 0x50, 0x6b, 0x51, 0x52, 0x51, 
            0x46, 0x61, 0x35, 0x45, 0x37, 0x48, 0x74, 0x71, 0x44, 0x6b, 0x5a, 
            0x6d, 0x56, 0x31, 0x54, 0x48, 0x34, 0x48, 0x43, 0x7a, 0x52, 0x32, 
            0x4e, 0x35, 0x4a, 0x36, 0x0a, 0x23, 0x32, 0x41, 0x52, 0x68, 0x59, 
            0x51, 0x73, 0x4d, 0x6d, 0x4d, 0x5a, 0x75, 0x77, 0x35, 0x4c, 0x50,
            0x6d, 0x5a, 0x51, 0x76, 0x79, 0x57, 0x6f, 0x54, 0x6d, 0x31, 0x56, 
            0x55, 0x48, 0x38, 0x6b, 0x53, 0x5a, 0x31, 0x34]).toString());
    const chunks = deviceWallet.makeTrezorMessage(buffer, messages.MessageType.MessageType_ResponseSkycoinAddress);
    t.equal(chunks.length, 2);
    t.equal(chunks[0].toString(), 
        new Uint8Array([0x3f, 0x23, 0x23, 0x00, 0x75, 0x00, 0x00, 0x00, 0x4a, 
            0x0a, 0x23, 0x32, 0x4e, 0x63, 0x6b, 0x50, 0x6b, 0x51, 0x52, 0x51, 
            0x46, 0x61, 0x35, 0x45, 0x37, 0x48, 0x74, 0x71, 0x44, 0x6b, 0x5a, 
            0x6d, 0x56, 0x31, 0x54, 0x48, 0x34, 0x48, 0x43, 0x7a, 0x52, 0x32, 
            0x4e, 0x35, 0x4a, 0x36, 0x0a, 0x23, 0x32, 0x41, 0x52, 0x68, 0x59, 
            0x51, 0x73, 0x4d, 0x6d, 0x4d, 0x5a, 0x75, 0x77, 0x35, 0x4c, 0x50]).toString());

    t.equal(chunks[1].toString(), 
        new Uint8Array([0x3f, 0x6d, 0x5a, 0x51, 0x76, 0x79, 0x57, 0x6f, 0x54, 
            0x6d, 0x31, 0x56, 0x55, 0x48, 0x38, 0x6b, 0x53, 0x5a, 0x31, 0x34, 
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]).toString());
    const responseSkycoinAddress = messages.ResponseSkycoinAddress.decode(buffer);
    t.equal(responseSkycoinAddress.addresses[0], "2NckPkQRQFa5E7HtqDkZmV1TH4HCzR2N5J6");
    t.equal(responseSkycoinAddress.addresses[1], "2ARhYQsMmMZuw5LPmZQvyWoTm1VUH8kSZ14");
});
