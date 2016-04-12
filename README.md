# Motion Detector

![motion detector](http://i.imgur.com/db4bQPw.gif)

A simple motion detection library in JavaScript.

## Usage

```javascript

// defaults
var options = {
    fps: 30,    // how many frames per second to capture
    gridSize: { // size of grid to detect on frame
        x: 6,  // rows
        y: 4   // cols
    },
    pixelDiffThreshold: 0.4,    // 0-1. how different pixels have to be to be considered a change
    movementThreshold: 0.001,   // 0-1. how much of a difference must there be in a 
                                // grid cell for it to be considered movement
    debug: false        // enable pausing on keypress for debugging
    canvasOutputElem:   // canvas element to show video frames to, if desired
}

// video element to stream webcam input into
var videoElemSrcId = document.getElementById('video-src'); 

var md = new MotionDetect(videoElemSrcId, options);

// ctx is context of canvas frames were drawn on
md.onDetect(function(ctx, data){
    // data.motions is a 1D array of grid by row, with
    // intensity of movement for each grid cell from 0-255
    // e.g. a frame with a lot of movement on 
    // the leftmost column would look something like this
    // [0, 0, 0, 0, 138, 1,
    // 0, 0, 0, 0, 0, 7, 
    // 0, 0, 2, 0, 0, 186, 
    // 0, 0, 0, 0, 0, 0]

    console.log(data.motions); 
}

```

See `app/index.js` for use of drawing the grid on frames 

## Development 
### Install
```
npm install
npm install webpack-dev-server webpack -g
```

### Serve

To serve at http://localhost:8080/:

```
webpack-dev-server --inline  --content-base public/ 
```

### Build

To compile HTML/CSS and JavaScript files for production:

```
webpack --config webpack.config.js
```
