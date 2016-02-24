import GridDetectWorker from 'worker!./GridDetectWorker';
import GridDetect from './GridDetect';
import Util from './Util';

export default class MotionDetect{

    constructor(srcId, dstId, options) {
        // constants
        this.MAX_PIX_VAL = 255;

        // setup video
        this.video = document.getElementById(srcId);
        this.fps = options.fps || 30;

        // setup canvas
        this.canvas = document.getElementById(dstId);
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

        // size to work with image on
        this.workingSize = {
            x: this.size.x,
            y: 300,
        };

        // griddetector size
        this.gdSize = options.gridSize;

        // size canvas
        this.resize(this.size.x, this.size.y);

        // start yo engines
        this.init();

        this.frames = {
            prev: null,
            curr: null,
        };

        // set difference threshold
        this.pixelDiffThreshold = 255*(options.pixelDiffThreshold || 0.4);
        
        // how much of ratio of movement to be not negligible
        this.movementThreshold = options.movementThreshold || 0.01;

        // this.frameDiff = Util.time(this.frameDiff, this);
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
        navigator.getUserMedia = navigator.mediaDevices.getUserMedia ||  navigator.getUserMedia || navigator.mozGetUserMedia ||
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


    // spawn worker thread to grid-out movement
    spawnGridDetector(imageData) {
        if(! this.frames.prev ) {return}
        
        const worker = new GridDetectWorker();
        worker.postMessage({
            frames: this.frames,
            pixelDiffThreshold: this.pixelDiffThreshold,
            movementThreshold: this.movementThreshold,
            gdSize: this.gdSize,
            imgSize: this.size,
        });
        worker.onmessage = (e) => {
            if(e.data){
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

