/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _interopRequireDefault = __webpack_require__(1)['default'];

	var _GridDetect = __webpack_require__(2);

	var _GridDetect2 = _interopRequireDefault(_GridDetect);

	onmessage = function (e) {
	    var d = e.data;

	    // create detector
	    var gd = new _GridDetect2['default']({
	        gridSize: d.gdSize,
	        imageSize: d.imageSize,
	        workingSize: d.workingSize,
	        pixelDiffThreshold: d.pixelDiffThreshold,
	        movementThreshold: d.movementThreshold
	    });

	    // get result
	    var detected = gd.detect(d.frames);
	    var msg = detected ? {
	        motions: detected,
	        gd: {
	            size: gd.size,
	            cellSize: gd.cellSize,
	            actualCellSizeRatio: gd.imageSize.x / gd.workingSize.x
	        } } : false;

	    // send response
	    postMessage(msg);
	    close();
	};

/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";

	exports["default"] = function (obj) {
	  return obj && obj.__esModule ? obj : {
	    "default": obj
	  };
	};

	exports.__esModule = true;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = __webpack_require__(3)['default'];

	var _classCallCheck = __webpack_require__(7)['default'];

	var _interopRequireDefault = __webpack_require__(1)['default'];

	Object.defineProperty(exports, '__esModule', {
	    value: true
	});

	var _Util = __webpack_require__(8);

	var _Util2 = _interopRequireDefault(_Util);

	var GridDetect = (function () {
	    function GridDetect(options) {
	        _classCallCheck(this, GridDetect);

	        this.size = options.gridSize;
	        this.imageSize = options.imageSize;
	        this.workingSize = options.workingSize;
	        this.cellSize = {
	            x: this.workingSize.x / this.size.x,
	            y: this.workingSize.y / this.size.y
	        };

	        this.pixelDiffThreshold = options.pixelDiffThreshold;
	        this.movementThreshold = options.movementThreshold;

	        // this.frameDiff = Util.time(this.frameDiff, this);
	    }

	    _createClass(GridDetect, [{
	        key: 'detect',
	        value: function detect(frames) {
	            // diff frames
	            var diff = this.frameDiff(frames.prev, frames.curr);

	            // if no valid diff
	            if (!diff) {
	                return;
	            };

	            // total pixels in frame
	            var totalPix = diff.imageData.data.length / 4;

	            // if not enough movement
	            if (diff.count / totalPix < this.movementThreshold) {
	                return false;
	            }

	            // else return movement in grid
	            return this.detectGrid(diff.imageData);
	        }

	        // given pixels of diff, bucket num of pixels diff into cells in grid
	    }, {
	        key: 'detectGrid',
	        value: function detectGrid(imageData) {

	            var pixels = imageData.data;
	            var results = new Int32Array(this.size.x * this.size.y);

	            // for each pixel, determine which quadrant it belongs to
	            var i = 0;
	            var j = undefined,
	                px = undefined,
	                py = undefined,
	                gx = undefined,
	                gy = undefined,
	                exists = undefined;
	            while (i < pixels.length / 4) {
	                px = i % this.workingSize.x;
	                py = Math.floor(i / this.workingSize.x);

	                gy = Math.floor(px / this.cellSize.x);
	                gx = Math.floor(py / this.cellSize.y);

	                if (pixels[i * 4] == 255) {
	                    var ri = gx * this.size.x + gy;
	                    results[ri] += 1;
	                }

	                i++;
	            }

	            return results;
	        }

	        // bitwise absolute and threshold
	        // from https://www.adobe.com/devnet/archive/html5/articles/javascript-motion-detection.html
	    }, {
	        key: 'makeThresh',
	        value: function makeThresh(min) {
	            return function (value) {
	                return (value ^ value >> 31) - (value >> 31) > min ? 255 : 0;
	            };
	        }

	        // diff two frames, return pixel diff data, boudning box of movement and count
	    }, {
	        key: 'frameDiff',
	        value: function frameDiff(prev, curr) {
	            if (prev == null || curr == null) {
	                return false;
	            };

	            var avgP = undefined,
	                avgC = undefined,
	                diff = undefined,
	                j = undefined,
	                i = undefined;
	            var p = prev.data;
	            var c = curr.data;
	            var thresh = this.makeThresh(this.pixelDiffThreshold);

	            // thresholding function
	            var pixels = new Uint8ClampedArray(p.length);

	            var count = 0;

	            // for each pixel, find if average excees thresh
	            i = 0;
	            while (i < p.length / 4) {
	                j = i * 4;

	                avgC = 0.2126 * c[j] + 0.7152 * c[j + 1] + 0.0722 * c[j + 2];
	                avgP = 0.2126 * p[j] + 0.7152 * p[j + 1] + 0.0722 * p[j + 2];

	                diff = thresh(avgC - avgP);

	                pixels[j + 3] = diff;

	                // if there is a difference, update bounds
	                if (diff) {
	                    pixels[j] = diff;

	                    // count pix movement
	                    count++;
	                }

	                i++;
	            }

	            return {
	                count: count,
	                imageData: new ImageData(pixels, this.workingSize.x) };
	        }
	    }]);

	    return GridDetect;
	})();

	exports['default'] = GridDetect;
	module.exports = exports['default'];

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _Object$defineProperty = __webpack_require__(4)["default"];

	exports["default"] = (function () {
	  function defineProperties(target, props) {
	    for (var i = 0; i < props.length; i++) {
	      var descriptor = props[i];
	      descriptor.enumerable = descriptor.enumerable || false;
	      descriptor.configurable = true;
	      if ("value" in descriptor) descriptor.writable = true;

	      _Object$defineProperty(target, descriptor.key, descriptor);
	    }
	  }

	  return function (Constructor, protoProps, staticProps) {
	    if (protoProps) defineProperties(Constructor.prototype, protoProps);
	    if (staticProps) defineProperties(Constructor, staticProps);
	    return Constructor;
	  };
	})();

	exports.__esModule = true;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(5), __esModule: true };

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(6);
	module.exports = function defineProperty(it, key, desc){
	  return $.setDesc(it, key, desc);
	};

/***/ },
/* 6 */
/***/ function(module, exports) {

	var $Object = Object;
	module.exports = {
	  create:     $Object.create,
	  getProto:   $Object.getPrototypeOf,
	  isEnum:     {}.propertyIsEnumerable,
	  getDesc:    $Object.getOwnPropertyDescriptor,
	  setDesc:    $Object.defineProperty,
	  setDescs:   $Object.defineProperties,
	  getKeys:    $Object.keys,
	  getNames:   $Object.getOwnPropertyNames,
	  getSymbols: $Object.getOwnPropertySymbols,
	  each:       [].forEach
	};

/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";

	exports["default"] = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

	exports.__esModule = true;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = __webpack_require__(3)['default'];

	var _classCallCheck = __webpack_require__(7)['default'];

	Object.defineProperty(exports, '__esModule', {
	    value: true
	});

	var Util = (function () {
	    function Util() {
	        _classCallCheck(this, Util);
	    }

	    _createClass(Util, null, [{
	        key: 'time',

	        // returns function that times it's execution
	        value: function time(f, scope) {
	            var start = undefined,
	                end = undefined;

	            return (function () {
	                start = new Date();
	                var res = f.apply(this, arguments);
	                end = new Date();
	                console.log('time', end - start);

	                return res;
	            }).bind(scope);
	        }
	    }]);

	    return Util;
	})();

	exports['default'] = Util;
	module.exports = exports['default'];

/***/ }
/******/ ]);