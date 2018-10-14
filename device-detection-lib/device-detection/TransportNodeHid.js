"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _getPrototypeOf = require("babel-runtime/core-js/object/get-prototype-of");

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _nodeHid = require("node-hid");

var _nodeHid2 = _interopRequireDefault(_nodeHid);

var _Transport2 = require("./hw-transport/Transport");

var _Transport3 = _interopRequireDefault(_Transport2);

var _getDevices = require("./getDevices");

var _getDevices2 = _interopRequireDefault(_getDevices);

var _listenDevices2 = require("./listenDevices");

var _listenDevices3 = _interopRequireDefault(_listenDevices2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// FIXME drop
function defer() {
  var resolve = void 0,
      reject = void 0;
  var promise = new _promise2.default(function (success, failure) {
    resolve = success;
    reject = failure;
  });
  if (!resolve || !reject) throw new Error("defer() error"); // this never happens and is just to make flow happy
  return { promise: promise, resolve: resolve, reject: reject };
}

var listenDevicesDebounce = 500;
var listenDevicesPollingSkip = function listenDevicesPollingSkip() {
  return false;
};
var listenDevicesDebug = function listenDevicesDebug() {};

/**
 * node-hid Transport implementation
 * @example
 * import TransportNodeHid from "@ledgerhq/hw-transport-node-u2f";
 * ...
 * TransportNodeHid.create().then(transport => ...)
 */

var TransportNodeHid = function (_Transport) {
  (0, _inherits3.default)(TransportNodeHid, _Transport);

  function TransportNodeHid(device) // FIXME not used?
  {
    var ledgerTransport = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var timeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    (0, _classCallCheck3.default)(this, TransportNodeHid);

    var _this = (0, _possibleConstructorReturn3.default)(this, (TransportNodeHid.__proto__ || (0, _getPrototypeOf2.default)(TransportNodeHid)).call(this));

    _this.device = device;
    _this.ledgerTransport = ledgerTransport;
    _this.timeout = timeout;
    _this.exchangeStack = [];
    return _this;
  }

  /**
   */


  (0, _createClass3.default)(TransportNodeHid, [{
    key: "close",
    value: function close() {
      this.device.close();
      return _promise2.default.resolve();
    }
  }], [{
    key: "open",


    /**
     */
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(path) {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt("return", _promise2.default.resolve(new TransportNodeHid(new _nodeHid2.default.HID(path))));

              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function open(_x3) {
        return _ref.apply(this, arguments);
      }

      return open;
    }()
  }]);
  return TransportNodeHid;
}(_Transport3.default);

TransportNodeHid.isSupported = function () {
  return _promise2.default.resolve(typeof _nodeHid2.default.HID === "function");
};

TransportNodeHid.list = function () {
  return _promise2.default.resolve((0, _getDevices2.default)().map(function (d) {
    return d.path;
  }));
};

TransportNodeHid.setListenDevicesDebounce = function (delay) {
  listenDevicesDebounce = delay;
};

TransportNodeHid.setListenDevicesPollingSkip = function (conditionToSkip) {
  listenDevicesPollingSkip = conditionToSkip;
};

TransportNodeHid.setListenDevicesDebug = function (debug) {
  listenDevicesDebug = typeof debug === "function" ? debug : debug ? function () {
    var _console;

    for (var _len = arguments.length, log = Array(_len), _key = 0; _key < _len; _key++) {
      log[_key] = arguments[_key];
    }

    return (_console = console).log.apply(_console, ["[listenDevices]"].concat(log));
  } : function () {};
};

TransportNodeHid.listen = function (observer) {
  var unsubscribed = false;
  _promise2.default.resolve((0, _getDevices2.default)()).then(function (devices) {
    // this needs to run asynchronously so the subscription is defined during this phase
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = (0, _getIterator3.default)(devices), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var device = _step.value;

        if (!unsubscribed) {
          var descriptor = device.path;
          observer.next({ type: "add", descriptor: descriptor, device: device });
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  });

  var _listenDevices = (0, _listenDevices3.default)(listenDevicesDebounce, listenDevicesPollingSkip, listenDevicesDebug),
      events = _listenDevices.events,
      stop = _listenDevices.stop;

  var onAdd = function onAdd(device) {
    if (unsubscribed || !device) return;
    observer.next({ type: "add", descriptor: device.path, device: device });
  };
  var onRemove = function onRemove(device) {
    if (unsubscribed || !device) return;
    observer.next({ type: "remove", descriptor: device.path, device: device });
  };
  events.on("add", onAdd);
  events.on("remove", onRemove);
  function unsubscribe() {
    unsubscribed = true;
    events.removeListener("add", onAdd);
    events.removeListener("remove", onRemove);
    stop();
  }
  return { unsubscribe: unsubscribe };
};

exports.default = TransportNodeHid;
module.exports = exports.default;