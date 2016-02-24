import GridDetect from './GridDetect';
onmessage = function(e) {
    const d = e.data;
    const gd = new GridDetect(d.gdSize, d.imgSize, d.pixelDiffThreshold, d.movementThreshold);
    const res = gd.detect(d.frames);

    let msg = res ?  {motions: res, gd: gd} : false;
    
    postMessage(msg);
};
