'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _TransportNodeHid = require('./TransportNodeHid');

var _TransportNodeHid2 = _interopRequireDefault(_TransportNodeHid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DeviceEventObserver = function () {
    function DeviceEventObserver() {
        (0, _classCallCheck3.default)(this, DeviceEventObserver);

        this.observers = [];
    }

    (0, _createClass3.default)(DeviceEventObserver, [{
        key: 'next',
        value: function next(obj) {
            console.log(obj.path);
            if (obj.type === 'add' && obj.device.manufacturer === 'SatoshiLabs') {
                console.log('Boom!');
            }
            if (obj.type === 'remove') {
                console.log('Bam!');
            }
        }
    }]);
    return DeviceEventObserver;
}();

exports.default = DeviceEventObserver;
module.exports = exports.default;