'use strict';
const Suite = require('node-test');
const messages = require('../protob/skycoin');
const deviceWallet = require('../device-wallet');

const suite = new Suite('Device wallet buffer creation');

suite.test('Fail message', t => {
    const failMsg = messages.Failure.create( {"message": "Ahyo"} );
    const buffer = messages.Failure.encode(failMsg).finish();
    const chunks = deviceWallet.makeTrezorMessage(buffer, 3);
    t.equal(chunks.length, 1);
    t.equal(chunks[0].toString(), new Uint8Array([63, 35, 35, 0, 3, 0, 0, 0, 6, 10, 4, 65, 104, 121, 111, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]).toString());
});
