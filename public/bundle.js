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

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _interopRequireDefault = __webpack_require__(2)['default'];

	var _componentsMotionDetect = __webpack_require__(3);

	var _componentsMotionDetect2 = _interopRequireDefault(_componentsMotionDetect);

	__webpack_require__(12);

	var options = {
	    gridSize: {
	        x: 6 * 4,
	        y: 4 * 4
	    },
	    debug: true,
	    pixelDiffThreshold: 0.3,
	    movementThreshold: 0.0012,
	    fps: 30,
	    canvasOutputElem: document.getElementById('dest')
	};

	var overlay = document.getElementById('overlay');
	var ctx = overlay.getContext('2d');
	var timeoutClear = undefined;

	var md = new _componentsMotionDetect2['default']('src', options);

	// on motion detected, draw grid
	md.onDetect(function (other, data) {
	    clearTimeout(timeoutClear);

	    var canvas = ctx.canvas;
	    canvas.width = other.canvas.width;
	    canvas.height = other.canvas.height;

	    ctx.save();
	    var grid = data.motions;
	    var gs = data.gd.size;
	    var cs = data.gd.cellSize;
	    var csActualRatio = data.gd.actualCellSizeRatio;

	    // scale up cell size
	    var cellArea = cs.x * cs.y;
	    cs.x *= csActualRatio;
	    cs.y *= csActualRatio;

	    ctx.strokeStyle = 'rgba(0, 80, 200, 0.2)';

	    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	    grid.forEach(function (cell, i) {
	        var x = i % gs.x;
	        var y = Math.floor(i / gs.x);
	        var intensity = cell / cellArea;
	        // higher opacity for cells with more movement
	        ctx.fillStyle = intensity > options.movementThreshold ? 'rgba(0, 80, 200, ' + (0.1 + intensity) + ')' : 'transparent';

	        ctx.beginPath();
	        ctx.rect(x * cs.x, y * cs.y, cs.x, cs.y);
	        ctx.closePath();
	        ctx.stroke();
	        ctx.fill();
	    });

	    ctx.restore();

	    timeoutClear = setTimeout(function () {
	        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	    }, 1000);
	});

/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";

	exports["default"] = function (obj) {
	  return obj && obj.__esModule ? obj : {
	    "default": obj
	  };
	};

	exports.__esModule = true;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = __webpack_require__(4)['default'];

	var _classCallCheck = __webpack_require__(8)['default'];

	var _interopRequireDefault = __webpack_require__(2)['default'];

	Object.defineProperty(exports, '__esModule', {
	    value: true
	});

	var _workerGridDetectWorker = __webpack_require__(9);

	var _workerGridDetectWorker2 = _interopRequireDefault(_workerGridDetectWorker);

	var _GridDetect = __webpack_require__(10);

	var _GridDetect2 = _interopRequireDefault(_GridDetect);

	var _Util = __webpack_require__(11);

	var _Util2 = _interopRequireDefault(_Util);

	var MotionDetect = (function () {
	    function MotionDetect(srcId, options) {
	        _classCallCheck(this, MotionDetect);

	        // constants
	        this.MAX_PIX_VAL = 255;

	        // defaults for options
	        this.defaults = {
	            fps: 30,
	            gridSize: {
	                x: 6,
	                y: 4
	            },
	            pixelDiffThreshold: 0.4,
	            movementThreshold: 0.001,
	            debug: false,
	            canvasOutputElem: document.createElement('canvas')
	        };

	        // setup video
	        this.video = document.getElementById(srcId);
	        this.fps = options.fps || this.defaults.fps;

	        // setup canvas
	        this.canvas = options.canvasOutputElem || this.defaults.canvasOutputElem;
	        this.ctx = this.canvas.getContext('2d');

	        // shadow canvas to draw video frames before processing
	        var shadowCanvas = document.createElement('canvas');
	        this.shadow = shadowCanvas.getContext('2d');

	        // document.body.appendChild(this.shadow.canvas);

	        // scratchpad
	        var scratchpad = document.createElement('canvas');
	        this.scratch = scratchpad.getContext('2d');

	        // document.body.appendChild(this.scratch.canvas);

	        // scale canvas
	        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
	        this.ctx.scale(-1, 1);

	        // actual canvas size
	        this.size = {
	            x: window.innerWidth,
	            y: window.innerHeight
	        };

	        // size to work with image on (scale down to reduce work)
	        this.workingSize = {
	            x: 300,
	            y: 300
	        };

	        // griddetector size
	        this.gdSize = options.gridSize || this.defaults.gridSize;

	        // size canvas
	        this.resize(this.size.x, this.size.y);

	        // start yo engines
	        this.init();

	        this.frames = {
	            prev: null,
	            curr: null
	        };

	        // set difference threshold
	        this.pixelDiffThreshold = 255 * (options.pixelDiffThreshold || this.defaults.pixelDiffThreshold);

	        // how much of ratio of movement to be not negligible
	        this.movementThreshold = options.movementThreshold || this.movementThreshold;

	        // this.spawnGridDetector = this.time(this.spawnGridDetector);
	        if (options.debug) this.debug();
	        this.pause = false;
	    }

	    _createClass(MotionDetect, [{
	        key: 'init',
	        value: function init() {
	            var _this = this;

	            // success callback
	            var onGetUserMediaSuccess = function onGetUserMediaSuccess(stream) {
	                _this.video.src = window.URL.createObjectURL(stream);
	                _this.video.addEventListener('play', function () {
	                    // start tick
	                    _this.tick();

	                    // resize canvas to video ratio
	                    var videoBounds = _this.video.getBoundingClientRect();
	                    var heightToWidthRatio = videoBounds.height / videoBounds.width;
	                    _this.resize(_this.size.x, _this.size.x * heightToWidthRatio);
	                }, false);
	            };

	            // error callback
	            var onGetUserMediaError = function onGetUserMediaError(e) {
	                console.error(e);
	            };

	            // configure getusermedia
	            navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;

	            var options = {
	                video: {
	                    width: {
	                        min: 1024,
	                        deal: 1280,
	                        max: 1920 },
	                    height: {
	                        min: 776,
	                        ideal: 720,
	                        max: 1080 }
	                }
	            };

	            // do it!
	            navigator.getUserMedia(options, onGetUserMediaSuccess, onGetUserMediaError);
	        }
	    }, {
	        key: 'resize',
	        value: function resize(x, y) {
	            this.size = {
	                x: Math.floor(x),
	                y: Math.floor(y)
	            };

	            // scale working size
	            var shadowY = Math.floor(this.size.y / this.size.x * this.workingSize.x);
	            this.workingSize = {
	                x: this.workingSize.x,
	                y: shadowY
	            };

	            // resize canvases
	            this.canvas.width = this.size.x;
	            this.canvas.height = this.size.y;
	            this.shadow.canvas.width = this.workingSize.x;
	            this.shadow.canvas.height = this.workingSize.y;
	            this.scratch.canvas.width = this.size.x;
	            this.scratch.canvas.height = this.size.y;
	        }

	        // main loop
	    }, {
	        key: 'tick',
	        value: function tick() {
	            var _this2 = this;

	            if (!this.pause) {
	                this.update();
	                this.detect();
	            }

	            setTimeout(function () {
	                requestAnimationFrame(_this2.tick.bind(_this2));
	            }, 1000 / this.fps);
	        }

	        // update and save frame data
	    }, {
	        key: 'update',
	        value: function update() {
	            // draw frame on shadow and canvas
	            var sw = this.workingSize.x;
	            var sh = this.workingSize.y;

	            this.shadow.save();
	            this.shadow.scale(-1, 1);
	            this.shadow.drawImage(this.video, 0, 0, -sw, sh);
	            this.shadow.restore();

	            this.ctx.save();
	            this.ctx.scale(-1, 1);
	            this.ctx.drawImage(this.video, 0, 0, -this.size.x, this.size.y);
	            this.ctx.restore();

	            // update data
	            this.frames.prev = this.frames.curr;
	            this.frames.curr = this.shadow.getImageData(0, 0, sw, sh);
	        }

	        // do detection
	    }, {
	        key: 'detect',
	        value: function detect() {
	            this.spawnGridDetector();
	        }

	        // set callback
	    }, {
	        key: 'onDetect',
	        value: function onDetect(fn) {
	            this.onDetectCallback = fn;
	        }

	        // spawn worker thread to do detection
	    }, {
	        key: 'spawnGridDetector',
	        value: function spawnGridDetector(imageData) {
	            var _this3 = this;

	            // do nothing if no prev frame
	            if (!this.frames.prev) {
	                return;
	            }

	            var worker = new _workerGridDetectWorker2['default']();

	            // create worker thread
	            worker.postMessage({
	                // frames to diff
	                frames: this.frames,

	                // thresholds
	                pixelDiffThreshold: this.pixelDiffThreshold,
	                movementThreshold: this.movementThreshold,

	                // grid size x cells by y cells
	                gdSize: this.gdSize,

	                // sizes for math
	                imageSize: this.size,
	                workingSize: this.workingSize
	            });

	            worker.onmessage = function (e) {
	                // if has data to return, fire callback
	                if (e.data) {
	                    _this3.onDetectCallback(_this3.ctx, e.data);
	                }
	            };
	        }

	        // activate pausing mechanism
	    }, {
	        key: 'debug',
	        value: function debug() {
	            var _this4 = this;

	            document.addEventListener('keydown', function () {
	                console.log('paused');
	                _this4.pause = !_this4.pause;
	            }, false);
	        }
	    }]);

	    return MotionDetect;
	})();

	exports['default'] = MotionDetect;
	module.exports = exports['default'];

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _Object$defineProperty = __webpack_require__(5)["default"];

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
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(6), __esModule: true };

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(7);
	module.exports = function defineProperty(it, key, desc){
	  return $.setDesc(it, key, desc);
	};

/***/ },
/* 7 */
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
/* 8 */
/***/ function(module, exports) {

	"use strict";

	exports["default"] = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

	exports.__esModule = true;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function() {
		return new Worker(__webpack_require__.p + "239c3e9f583fc558264d.worker.js");
	};

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = __webpack_require__(4)['default'];

	var _classCallCheck = __webpack_require__(8)['default'];

	var _interopRequireDefault = __webpack_require__(2)['default'];

	Object.defineProperty(exports, '__esModule', {
	    value: true
	});

	var _Util = __webpack_require__(11);

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
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = __webpack_require__(4)['default'];

	var _classCallCheck = __webpack_require__(8)['default'];

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

/***/ },
/* 12 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }
/******/ ]);