import GridDetect from './GridDetect';
onmessage = function(e) {
    const gd = new GridDetect(e.data.gdSize, e.data.imgSize, e.data.pixelDiffThreshold);

    const res = gd.detect(e.data.frames, e.data.movementThreshold);
    
    postMessage({motions: res, gd: gd});
};
