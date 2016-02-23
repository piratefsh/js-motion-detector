
export default class GridDetect{
    constructor(gridSize, imageSize) {
        this.size = gridSize;
        this.imageSize = imageSize;
        this.cellSize = {
            x: Math.floor(imageSize.x / this.size.x),
            y: Math.floor(imageSize.y / this.size.y),
        };

        this.threshold = 0.5;
    }

    detect(imageData) {
        const pixels = imageData.data;
        const results = {};
        for(let i = 0; i < this.size.x; i++){
            for(let j = 0; j < this.size.y; j++){
                results[[i, j]] = 0;
            }
        }

        // for each pixel, determine which quadrant it belongs to
        let i = 0;
        let j, px, py, gx, gy, exists;
        while(i < pixels.length/4){
            px = i%this.imageSize.x;
            py = Math.floor(i/this.imageSize.x);

            gx = Math.floor(px/this.cellSize.x);
            gy = Math.floor(py/this.cellSize.y);

            if(pixels[i*4] == 255){
                results[[gx, gy]] += 1;
            }

            i++;
        }
        return results;
    }
}

// onmessage = function(e) {
//     const size = e.data.gridSize;
//     const imgD = e.data.imageData;
//     const gd = new GridDetect(size, {x: imgD.width, y: imgD.height});
//     const results = gd.detect(imgD);
//     postMessage({
//         grid: results,
//         gridSize: size,
//         cellSize: gd.cellSize
//     });
// };
