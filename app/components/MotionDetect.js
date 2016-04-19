import GridDetectWorker from 'worker!./GridDetectWorker';
import GridDetect from './GridDetect';
import Util from './Util';

export default class MotionDetect{

    constructor(srcId, options) {
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
        }

        // setup video
        this.video = document.getElementById(srcId);
        this.fps = options.fps || this.defaults.fps;

        // setup canvas
        this.canvas = options.canvasOutputElem || this.defaults.canvasOutputElem;
        this.ctx = this.canvas.getContext('2d');

        // shadow canvas to draw video frames before processing
        const shadowCanvas = document.createElement('canvas');
        this.shadow = shadowCanvas.getContext('2d');

        // document.body.appendChild(this.shadow.canvas);

        // scratchpad
        const scratchpad = document.createElement('canvas');
        this.scratch = scratchpad.getContext('2d');

        // document.body.appendChild(this.scratch.canvas);

        // scale canvas
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.ctx.scale(-1, 1);

        // actual canvas size
        this.size = {
            x: window.innerWidth,
            y: window.innerHeight,
        };

        // size to work with image on (scale down to reduce work)
        this.workingSize = {
            x: 300,
            y: 300,
        };

        // griddetector size
        this.gdSize = options.gridSize || this.defaults.gridSize;

        // size canvas
        this.resize(this.size.x, this.size.y);

        // start yo engines
        this.init();

        this.frames = {
            prev: null,
            curr: null,
        };

        // set difference threshold
        this.pixelDiffThreshold = 255 * (options.pixelDiffThreshold || this.defaults.pixelDiffThreshold);

        // how much of ratio of movement to be not negligible
        this.movementThreshold = options.movementThreshold || this.movementThreshold;

        // this.spawnGridDetector = this.time(this.spawnGridDetector);
        if (options.debug) this.debug();
        this.pause = false;
    }

    init() {

        // success callback
        const onGetUserMediaSuccess = (stream) => {
            this.video.src = window.URL.createObjectURL(stream);
            this.video.addEventListener('play', () => {
                // start tick
                this.tick();

                // resize canvas to video ratio
                const videoBounds = this.video.getBoundingClientRect();
                const heightToWidthRatio = videoBounds.height / videoBounds.width;
                this.resize(this.size.x, this.size.x * heightToWidthRatio);
            }, false);

        };

        // error callback
        const onGetUserMediaError = (e) => { console.error(e); };

        // configure getusermedia
        navigator.getUserMedia =  navigator.getUserMedia || navigator.mozGetUserMedia ||
        navigator.webkitGetUserMedia || navigator.msGetUserMedia;

        const options = {
            video: {
                width: {
                    min: 1024,
                    deal: 1280,
                    max: 1920, },
                height: {
                    min: 776,
                    ideal: 720,
                    max: 1080, },
            },
        };

        // do it!
        navigator.getUserMedia(options, onGetUserMediaSuccess, onGetUserMediaError);
    }

    resize(x, y) {
        this.size = {
            x: Math.floor(x),
            y: Math.floor(y),
        };

        // scale working size
        const shadowY = Math.floor(this.size.y / this.size.x * this.workingSize.x);
        this.workingSize = {
            x: this.workingSize.x,
            y: shadowY,
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
    tick() {
        if (!this.pause) {
            this.update();
            this.detect();
        }

        setTimeout(()=> {
            requestAnimationFrame(this.tick.bind(this));
        }, 1000 / this.fps);
    }

    // update and save frame data
    update() {
        // draw frame on shadow and canvas
        const sw = this.workingSize.x;
        const sh = this.workingSize.y;

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
    detect() {
        this.spawnGridDetector();
    }

    // set callback
    onDetect(fn) {
        this.onDetectCallback = fn;
    }

    // spawn worker thread to do detection
    spawnGridDetector(imageData) {
        // do nothing if no prev frame
        if (!this.frames.prev) {return; }

        const worker = new GridDetectWorker();

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
            workingSize: this.workingSize,
        });

        worker.onmessage = (e) => {
            // if has data to return, fire callback
            if (e.data) {
                this.onDetectCallback(this.ctx, e.data);
            }
        };
    }

    // activate pausing mechanism
    debug() {
        document.addEventListener('keydown', ()=> {
            console.log('paused');
            this.pause = !this.pause;
        }, false);
    }

}

