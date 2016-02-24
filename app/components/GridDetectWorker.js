import GridDetect from './GridDetect';
onmessage = function(e) {
    const gd = new GridDetect(e.data.gdSize, e.data.imgSize);
    const res = gd.detect(e.data.imageData);
    
    postMessage({motions: res, gd: gd});
};
