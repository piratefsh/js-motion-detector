import MotionDetect from './components/MotionDetect'
import 'styles/style.scss' 

const md = new MotionDetect('src', 'dest', {
    gridSize: {
        x: 4*4,
        y: 3*4,
    },
    debug: true,
    pixelDiffThreshold: 0.4,
    fps: 30
});

// on motion detected, draw grid
md.onDetect((ctx, data) => {
    ctx.save();
    const grid = data.motions;
    const gs = data.gd.size;
    const cs = data.gd.cellSize;

    const movementThreshold = 0.01;
    const cellArea = cs.x * cs.y;

    ctx.strokeStyle = 'rgba(0, 80, 200, 0.3)';

    grid.forEach((cell, i) => {
        const x = i % gs.x;
        const y = Math.floor(i / gs.x);
        let intensity = cell / cellArea;

        ctx.fillStyle = intensity > movementThreshold ? `rgba(0, 80, 200, ${0.1 + intensity})` : 'transparent';

        ctx.beginPath();
        ctx.rect(x * cs.x, y * cs.y, cs.x, cs.y);
        ctx.closePath();
        // ctx.stroke();
        ctx.fill();
    });

    ctx.restore();
    
})