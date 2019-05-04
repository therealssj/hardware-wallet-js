const deviceWallet = require("../device-wallet");
const utils = require("../utils");
const setup = utils.deviceSetup;
const constPinCodeReader = utils.pinCodeReader;
const expect = require("chai").expect;

describe("Cancel Request test", function() {
  this.timeout(0);
  if (deviceWallet.getDevice() === null) {
    console.log("Skycoin hardware NOT FOUND, using emulator");
    deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.EMULATOR);
    // DeviceWallet.setAutoPressButton(true, "R", false);
  } else {
    console.log("Skycoin hardware is plugged in");
    deviceWallet.setDeviceType(deviceWallet.DeviceTypeEnum.USB);
  }

  it("Should cancel pending requests", function(done) {
    console.log('Autopress: ', deviceWallet.setAutoPressButton(true, "R", false));
    setTimeout(function() {
      deviceWallet.
        devCancelRequest().
        then(() => {
          // Done();
          console.log("Cancel request Done");
        }).
        catch((err) => {
          console.log("Cancel request error: ", err);
        });
    }, 2000);

    setup().
      then(deviceWallet.devChangePin).
      then(() => {
        done(new Error("The Cancel Request is not working"));
      }).
      catch(() => {
        done();
      });
  });

  it("Should change and remove PIN if not canceled", function(done) {
    console.log('Autopress: ', deviceWallet.setAutoPressButton(true, "R"));

    setTimeout(function() {
      deviceWallet.
        devCancelRequest().
        then(() => {
          // Done();
          console.log("Cancel request Done 2");
        }).
        catch((err) => {
          console.log("Cancel request error 2: ", err);
        });
    }, 2000);

    setup().
      then(deviceWallet.devGetFeatures).
      then((features1) => {
        expect(features1.pinProtection).to.be.false();
      }).
      then(deviceWallet.devChangePin(constPinCodeReader("1234"))).
      then(deviceWallet.devGetFeatures).
      then((features2) => {
        expect(features2.pinProtection).to.be.true();
      }).
      then(deviceWallet.devRemovePin(constPinCodeReader("1234"))).
      then(deviceWallet.devGetFeatures).
      then((features3) => {
        expect(features3.pinProtection).to.be.false();
      }).
      catch((err) => {
        console.log("ERROR: ", err);
        done();
      });
  });
});
