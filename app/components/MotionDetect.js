export default class MotionDetect{
    constructor(srcId, dstId){
        // setup video
        this.video = document.getElementById(srcId);

        // setup canvas
        this.canvas = document.getElementById(dstId);
        this.ctx = this.canvas.getContext('2d');

        // shadow canvas to draw video frames before processing
        const shadowCanvas = document.createElement('canvas');
        this.shadow = shadowCanvas.getContext('2d');
        document.body.appendChild(this.shadow.canvas);

        // scratchpad
        const scratchpad = document.createElement('canvas');
        this.scratch = scratchpad.getContext('2d');
        document.body.appendChild(this.scratch.canvas);

        // scale canvas
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        this.size = {
            x: window.innerWidth,
            y: window.innerHeight
        }
        this.shadowSize = {
            x: 400,
            y: 300
        }

        // size canvas
        this.resize(this.size.x, this.size.y);

        // start yo engines
        this.init();

        this.frames = {
            prev: null,
            curr: null
        }

        this.thresh = this.makeThresh(80);
    }


    init(){
        // success callback
        const onGetUserMediaSuccess = (stream) => {
            this.video.src = window.URL.createObjectURL(stream);
            this.video.addEventListener('play', () => {
                // start tick
                this.tick();  

                // resize canvas to video ratio
                const videoBounds = this.video.getBoundingClientRect();
                const heightToWidthRatio = videoBounds.height/videoBounds.width;
                this.resize(this.size.x, this.size.x*heightToWidthRatio);          
            }, false);

        }

        // error callback
        const onGetUserMediaError = (e) => { console.error(e); }

        // configure getusermedia
        navigator.getUserMedia = navigator.mediaDevices.getUserMedia ||  navigator.getUserMedia || navigator.mozGetUserMedia ||
        navigator.webkitGetUserMedia || navigator.msGetUserMedia;

        const options = {
            video: {
                width: { 
                    min: 1024, 
                    deal: 1280, 
                    max: 1920 },
                height: { 
                    min: 776, 
                    ideal: 720, 
                    max: 1080 }
            },
        }

        // do it!
        navigator.getUserMedia(options, onGetUserMediaSuccess, onGetUserMediaError);
    }

    resize(x, y){
        this.size = {
            x: Math.floor(x),
            y: Math.floor(y)
        }

        const shadowY = Math.floor(this.size.y/this.size.x * this.shadowSize.x);
        this.shadowSize = {
            x: 300,
            y: shadowY
        }
        console.log(this.shadowSize);

        this.canvas.width = this.size.x;
        this.canvas.height = this.size.y;
        this.shadow.canvas.width = this.shadowSize.x;
        this.shadow.canvas.height = this.shadowSize.y;
        this.scratch.canvas.width = this.size.x;
        this.scratch.canvas.height = this.size.y;
    }

    // main loop
    tick() {
        this.update();
        this.draw();

        requestAnimationFrame(this.tick.bind(this));
    }

    // update and save frame data
    update(){
        // draw frame
        const sw = this.shadowSize.x;
        const sh = this.shadowSize.y;
        this.shadow.drawImage(this.video, 0, 0, sw, sh);

        // update data
        this.frames.prev = this.frames.curr;
        this.frames.curr = this.shadow.getImageData(0, 0, sw, sh);
    }

    // draw video and animation
    draw(){
        // find difference between frames
        const diff = this.frameDiff(this.frames.prev, this.frames.curr);

        // draw difference
        if(diff){
            this.scratch.putImageData(diff, 0, 0);

            const scale = {
                x: this.size.x/this.shadowSize.x, 
                y: this.size.y/this.shadowSize.y
            }

            this.ctx.drawImage(this.scratch.canvas, 0, 0, this.shadowSize.x, this.shadowSize.y, 0, 0, this.size.x, this.size.y);
        }
    }

    // bitwise absolute and threshold 
    // from https://www.adobe.com/devnet/archive/html5/articles/javascript-motion-detection.html
    makeThresh(min) {
        return function(value){
            return (value ^ (value >> 31)) - (value >> 31) > min ? 255 : 0;
        } 
    }

    frameDiff(prev, curr){
        if(prev == null || curr == null){ return false};
        
        let r, g, b, a, avgP, avgC, diff, j, i;
        const p = prev.data;
        const c = curr.data;

        const thresh = this.thresh;
        const pixels = new Array(prev.length);

        i = 0;
        while(i < p.length/4){
            j = i * 4;

            avgC = ((c[j] + c[j+1] + c[j+2])/3);
            avgP = ((p[j] + p[j+1] + p[j+2])/3);

            diff = thresh(avgC - avgP);

            pixels[j] = diff;
            pixels[j+1] = diff;
            pixels[j+2] = diff;
            pixels[j+3] = 255;

            i++;
        }

        const arr = new Uint8ClampedArray(pixels);
        return new ImageData(arr, this.shadowSize.x);
    }
}

