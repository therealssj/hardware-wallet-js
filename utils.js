const rejectPromise = function (reject) {
  return function(msg) {
    console.log("Promise rejected", msg);
    if ( reject ) {
      reject(new Error(msg));
    }
  };
};

const wordReader = function () {
  return new Promise((resolve) => {
    console.log("Inside wordReader callback, please input word: ");
    const word = scanf('%s');
    resolve(word);
  });
};

const pinCodeReader = function (msg) {
  return function() {
    return new Promise((resolve, reject) => {
      console.log(`Enter pinCodeReader : ${msg}`);
      const pinCode = scanf('%s');
      if (pinCode.length != 4) {
        reject(new Error("Pin code mismatch"));
        return;
      }
      resolve(pinCode);
    });
  };
};

module.exports = {
  pinCodeReader,
  rejectPromise,
  wordReader
};
