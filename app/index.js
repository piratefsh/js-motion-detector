import MotionDetect from './components/MotionDetect' 
import 'styles/style.scss' 

const options = {
    gridSize: {
        x: 16*2,
        y: 12*2,
    },
    debug: true,
    pixelDiffThreshold: 0.3,
    movementThreshold: 0.0012,
    fps: 30,
    canvasOutputElem: document.getElementById('dest')
}

var overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
let timeoutClear;

const md = new MotionDetect('src', options);

// on motion detected, draw grid
md.onDetect((other, data) => {
    clearTimeout(timeoutClear);

    const canvas = ctx.canvas;
    canvas.width = other.canvas.width;
    canvas.height = other.canvas.height;

    ctx.save();
    const grid = data.motions;
    const gs = data.gd.size;
    const cs = data.gd.cellSize;
    const csActualRatio = data.gd.actualCellSizeRatio;

    // scale up cell size
    const cellArea = cs.x * cs.y;
    cs.x *= csActualRatio;
    cs.y *= csActualRatio;

    ctx.strokeStyle = 'rgba(0, 80, 200, 0.2)';

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    grid.forEach((cell, i) => {
        const x = i % gs.x;
        const y = Math.floor(i / gs.x);
        let intensity = cell / cellArea;
        // higher opacity for cells with more movement
        ctx.fillStyle = intensity > options.movementThreshold ? `rgba(0, 80, 200, ${0.1 + intensity})` : 'transparent';

        ctx.beginPath();
        ctx.rect(x * cs.x, y * cs.y, cs.x, cs.y);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    });

    ctx.restore();

    timeoutClear = setTimeout(()=>{
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }, 1000);
    
})