const rejectPromise = function (msg) {
  console.log("Promise rejected", msg);
};

const wordReader = function () {
  return new Promise((resolve) => {
      console.log("Inside wordReader callback, please input word: ");
      const word = scanf('%s');
      resolve(word);
  });
};

const pinCodeReader = function () {
  return new Promise((resolve, reject) => {
      console.log("Got inside pinCodeReader");
      const pinCode = scanf('%s');
      if (pinCode.length != 4) {
          reject(new Error("Bad pin code"));
          return;
      }
      resolve(pinCode);
  });
};

module.exports = {
  rejectPromise,
  wordReader,
  pinCodeReader
};