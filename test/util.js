
const rejectPromise = function (reject, errMsg) {
    return function(msg) {
        console.log("Promise rejected", msg);
        reject(new Error(errMsg || msg));
    };
};

module.exports = {
  rejectPromise
};
