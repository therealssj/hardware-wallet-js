"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _nodeHid = require("node-hid");

var _nodeHid2 = _interopRequireDefault(_nodeHid);

var _Transport2 = require("./hw-transport/Transport");

var _Transport3 = _interopRequireDefault(_Transport2);

var _getDevices = require("./getDevices");

var _getDevices2 = _interopRequireDefault(_getDevices);

var _listenDevices2 = require("./listenDevices");

var _listenDevices3 = _interopRequireDefault(_listenDevices2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// FIXME drop
function defer() {
  var resolve = void 0,
      reject = void 0;
  var promise = new Promise(function (success, failure) {
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
  _inherits(TransportNodeHid, _Transport);

  function TransportNodeHid(device) // FIXME not used?
  {
    var ledgerTransport = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    var timeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

    _classCallCheck(this, TransportNodeHid);

    var _this = _possibleConstructorReturn(this, (TransportNodeHid.__proto__ || Object.getPrototypeOf(TransportNodeHid)).call(this));

    _this.device = device;
    _this.ledgerTransport = ledgerTransport;
    _this.timeout = timeout;
    _this.exchangeStack = [];
    return _this;
  }

  /**
   */


  _createClass(TransportNodeHid, [{
    key: "close",
    value: function close() {
      this.device.close();
      return Promise.resolve();
    }
  }], [{
    key: "open",


    /**
     */
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(path) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt("return", Promise.resolve(new TransportNodeHid(new _nodeHid2.default.HID(path))));

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
  return Promise.resolve(typeof _nodeHid2.default.HID === "function");
};

TransportNodeHid.list = function () {
  return Promise.resolve((0, _getDevices2.default)().map(function (d) {
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
  Promise.resolve((0, _getDevices2.default)()).then(function (devices) {
    // this needs to run asynchronously so the subscription is defined during this phase
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = devices[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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