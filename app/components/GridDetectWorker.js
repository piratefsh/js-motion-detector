import GridDetect from './GridDetect';
onmessage = function(e) {
    const d = e.data;

    // create detector
    const gd = new GridDetect({
        gridSize: d.gdSize,
        imageSize: d.imageSize,
        workingSize: d.workingSize,
        pixelDiffThreshold: d.pixelDiffThreshold,
        movementThreshold: d.movementThreshold,
    });

    // get result
    const detected = gd.detect(d.frames);
    let msg = detected ?  {
        motions: detected,
        gd: {
            size: gd.size,
            cellSize: gd.cellSize,
            actualCellSizeRatio: gd.imageSize.x / gd.workingSize.x,
        }, } : false;

    // send response
    postMessage(msg);
    close();
};
