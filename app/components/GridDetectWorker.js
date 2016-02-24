import GridDetect from './GridDetect';
onmessage = function(e) {
    const d = e.data;
    const gd = new GridDetect({
        gridSize: d.gdSize, 
        imageSize: d.imgSize, 
        pixelDiffThreshold: d.pixelDiffThreshold, 
        movementThreshold: d.movementThreshold
    });

    const detected = gd.detect(d.frames);

    let msg = detected ?  {motions: detected, gd: gd} : false;
    
    postMessage(msg);
};