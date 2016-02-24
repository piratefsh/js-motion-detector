import MotionDetect from './components/MotionDetect'
import 'styles/style.scss' 

const options = {
    gridSize: {
        x: 4*4,
        y: 3*4,
    },
    debug: true,
    pixelDiffThreshold: 0.4,
    movementThreshold: 0.0012,
    fps: 20
}

var overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
let timeoutClear;

const md = new MotionDetect('src', 'dest', options);

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

    const cellArea = cs.x * cs.y;

    ctx.strokeStyle = 'rgba(0, 80, 200, 0.3)';

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
    }, 100);
    
})