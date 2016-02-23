
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
        const results = new Int32Array(this.size.x*this.size.y);

        // for each pixel, determine which quadrant it belongs to
        let i = 0;
        let j, px, py, gx, gy, exists;
        while(i < pixels.length/4){
            px = i%this.imageSize.x;
            py = Math.floor(i/this.imageSize.x);

            gx = Math.floor(px/this.cellSize.x);
            gy = Math.floor(py/this.cellSize.y);

            if(pixels[i*4] == 255){
                let ri = gx*this.size.x + gy;
                results[ri] += 1;
            }

            i++;
        }
        return results;
    }
}
