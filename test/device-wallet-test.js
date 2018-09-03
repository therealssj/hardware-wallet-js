'use strict';
const Suite = require('node-test');
const messages = require('../protob/skycoin');
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
