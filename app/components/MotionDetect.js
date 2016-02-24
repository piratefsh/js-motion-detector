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
        const pixelDiffThreshold = options.pixelDiffThreshold || 0.4;
        this.thresh = this.makeThresh(pixelDiffThreshold * this.MAX_PIX_VAL);

        this.frameDiff = Util.time(this.frameDiff, this);
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
            this.draw();
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

    // draw video and animation
    draw() {
        // find difference between frames
        const result  = this.frameDiff(this.frames.prev, this.frames.curr);

        // return if no difference found
        if (!result) { return; }

        // draw difference
        const tl = result.position.tl;
        const br = result.position.br;
        const count = result.count;
        const diff = result.imageData;

        // put diff on scratch pad (can't draw straight on canvas
        // because can only scale with drawImage)

        this.scratch.putImageData(diff, 0, 0);

        // draw diff
        // this.ctx.drawImage(this.scratch.canvas, 0, 0, this.workingSize.x, this.workingSize.y, 0, 0, this.size.x, this.size.y);

        // drop if change if negligible
        const totalPix = diff.data.length / 4;

        if (count / totalPix < this.movementThreshold) { return; }

        this.spawnGridDetector(diff);
    }

    // set callback
    onDetect(fn) {
        this.onDetectCallback = fn;
    }

    // bitwise absolute and threshold
    // from https://www.adobe.com/devnet/archive/html5/articles/javascript-motion-detection.html
    makeThresh(min) {
        return function(value) {
            return (value ^ (value >> 31)) - (value >> 31) > min ? 255 : 0;
        };
    }

    // diff two frames, return pixel diff data, boudning box of movement and count
    frameDiff(prev, curr) {
        if (prev == null || curr == null) { return false;};
        let r, g, b, a, avgP, avgC, diff, j, i;
        const p = prev.data;
        const c = curr.data;

        // thresholding function
        const thresh = this.thresh;
        const pixels = new Uint8ClampedArray(p.length);

        // save top left and bottom right bounds of movement
        let tl = {x: Infinity, y: Infinity};
        let br = {x: -1, y: -1};

        let count = 0;

        // for each pixel, find if average excees thresh
        i = 0;
        while (i < p.length / 4) {
            j = i * 4;

            avgC = 0.2126 * c[j] + 0.7152 * c[j + 1] + 0.0722 * c[j + 2];
            avgP = 0.2126 * p[j] + 0.7152 * p[j + 1] + 0.0722 * p[j + 2];

            diff = thresh(avgC - avgP);

            pixels[j] = diff;
            pixels[j + 1] = 0;
            pixels[j + 2] = diff;
            pixels[j + 3] = diff;


            // if there is a difference, update bounds
            if (diff) {
                const x = i % this.workingSize.x;
                const y = Math.floor(i / this.workingSize.x);
                tl.x = Math.min(tl.x, x);
                tl.y = Math.min(tl.y, y);
                br.x = Math.max(br.x, x);
                br.y = Math.max(br.y, y);

                // count pix movement
                count++;
            }
            i++;
        }

        return {
            position: {
                tl: tl,
                br: br,
            },
            count: count,
            imageData: new ImageData(pixels, this.workingSize.x), };
    }

    // spawn worker thread to grid-out movement
    spawnGridDetector(imageData) {
        const worker = new GridDetectWorker();
        worker.postMessage({
            imageData: imageData,
            gdSize: this.gdSize,
            imgSize: this.size,
        });
        worker.onmessage = (e) => {
            this.onDetectCallback(this.ctx, e.data);
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

