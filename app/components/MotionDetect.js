import ContourDetectWorker from 'worker!./ContourDetectWorker';

export default class MotionDetect{
    constructor(srcId, dstId) {
        // setup video
        this.video = document.getElementById(srcId);

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
            x: 300,
            y: 300,
        };

        // size canvas
        this.resize(this.size.x, this.size.y);

        // start yo engines
        this.init();

        this.frames = {
            prev: null,
            curr: null,
        };

        // set difference threshold
        this.thresh = this.makeThresh(60);

        // this.frameDiff = this.time(this.frameDiff);

        this.test();
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

        const shadowY = Math.floor(this.size.y / this.size.x * this.workingSize.x);
        this.workingSize = {
            x: 300,
            y: shadowY,
        };

        this.canvas.width = this.size.x;
        this.canvas.height = this.size.y;
        this.shadow.canvas.width = this.workingSize.x;
        this.shadow.canvas.height = this.workingSize.y;
        this.scratch.canvas.width = this.size.x;
        this.scratch.canvas.height = this.size.y;
    }

    // main loop
    tick() {
        this.update();
        this.draw();
        setTimeout(()=> {
            requestAnimationFrame(this.tick.bind(this));
        }, 1000 / 60);
    }

    // update and save frame data
    update() {
        // draw frame on shadow and canvas
        const sw = this.workingSize.x;
        const sh = this.workingSize.y;
        this.shadow.drawImage(this.video, 0, 0, sw, sh);
        this.ctx.drawImage(this.video, 0, 0, this.size.x, this.size.y);

        // update data
        this.frames.prev = this.frames.curr;
        this.frames.curr = this.shadow.getImageData(0, 0, sw, sh);
    }

    // draw video and animation
    draw() {
        // find difference between frames
        const hasDiff = this.frameDiff(this.frames.prev, this.frames.curr);

        // draw difference
        if (hasDiff) {
            let [tl, br, count, diff] = hasDiff;
            this.scratch.putImageData(diff, 0, 0);

            const scale = {
                x: -this.size.x / this.workingSize.x,
                y: this.size.y / this.workingSize.y,
            };

            // draw diff
            this.ctx.drawImage(this.scratch.canvas, 0, 0, this.workingSize.x, this.workingSize.y, 0, 0, this.size.x, this.size.y);

            // if significant enough change
            const totalPix = diff.data.length / 4;
            if (count / totalPix < 0.01) { return; }

            // draw rect
            const size = {
                x: br.x - tl.x,
                y: br.y - tl.y,
            };

            this.ctx.save();
            // scale up from working size
            this.ctx.scale(scale.x, scale.y);
            this.ctx.beginPath();

            // draw motion area
            this.ctx.rect(tl.x, tl.y, size.x, size.y);
            this.ctx.closePath();
            this.ctx.restore();

            this.ctx.strokeStyle = 'red';
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.fill();
        }
    }

    // bitwise absolute and threshold
    // from https://www.adobe.com/devnet/archive/html5/articles/javascript-motion-detection.html
    makeThresh(min) {
        return function(value) {
            return (value ^ (value >> 31)) - (value >> 31) > min ? 255 : 0;
        };
    }

    frameDiff(prev, curr) {
        if (prev == null || curr == null) { return false;};

        let r, g, b, a, avgP, avgC, diff, j, i;
        const p = prev.data;
        const c = curr.data;

        // thresholding function
        const thresh = this.thresh;
        const pixels = new Array(prev.length);


        // save bounds of movement
        let tl = {x: Infinity, y: Infinity};
        let br = {x: -1, y: -1};

        let count = 0;

        // for each pixel, find if average excees thresh
        i = 0;
        while (i < p.length / 4) {
            j = i * 4;

            avgC = ((c[j] + c[j + 1] + c[j + 2]) / 3);
            avgP = ((p[j] + p[j + 1] + p[j + 2]) / 3);

            diff = thresh(avgC - avgP);

            pixels[j] = diff;
            pixels[j + 1] = diff;
            pixels[j + 2] = diff;
            pixels[j + 3] = diff;

            i++;

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
        }

        const arr = new Uint8ClampedArray(pixels);
        return [tl, br, count, new ImageData(arr, this.workingSize.x)];
    }

    time(f) {
        let start, end;

        return function() {
            start = new Date();
            const res = f.apply(this, arguments);
            end = new Date();
            console.log('time', end - start);

            return res;
        }.bind(this);

    }

    test() {
        const worker = new ContourDetectWorker();
        worker.postMessage('ola');
    }
}

