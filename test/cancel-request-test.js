const deviceWallet = require('../device-wallet');
const utils = require('../utils');
const setup = utils.deviceSetup;
const constCodeReader = utils.constCodeReader;
const expect = require('chai').expect;

describe('Cancel Request test', function () {
  this.timeout(0);
  if (deviceWallet.getDevice() === null) {
    console.log("Skycoin hardware NOT FOUND, using emulator");
    deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.EMULATOR);
  } else {
    console.log("Skycoin hardware is plugged in");
    deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.USB);
  }

  it("Should cancel pending requests", function(done) {
    setTimeout(function() {
      deviceWallet.devCancelRequest().then(() => {
        done();
      });
    }, 2000);

    setup().
      then(deviceWallet.devChangePin).
      then(() => {
        done(new Error('The Cancel Request is not working'));
      }).
      catch(() => {
        done();
      });
  });

  it("Should change and remove PIN if not canceled", function(done) {
    return setup().
      then(deviceWallet.devGetFeatures).
      then((features) => {
        expect(features.pinProtection).to.be.false();
      }).
      then(deviceWallet.devChangePin(constPinReader('1234'))).
      then(deviceWallet.devGetFeatures).
      then((features) => {
        expect(features.pinProtection).to.be.true();
      }).
      then(deviceWallet.devRemovePin(constPinReader('1234'))).
      then(deviceWallet.devGetFeatures).
      then((features) => {
        expect(features.pinProtection).to.be.false();
        done();
      });
  });

});
