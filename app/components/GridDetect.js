
export default class GridDetect{
    constructor(gridSize, imageSize, pixelDiffThreshold) {
        this.size = gridSize;
        this.imageSize = imageSize;
        this.cellSize = {
            x: Math.floor(imageSize.x / this.size.x),
            y: Math.floor(imageSize.y / this.size.y),
        };

        this.threshold = 0.5;
        this.pixelDiffThreshold = pixelDiffThreshold;
    }

    detect(frames, movementThreshold){
        const diff = this.frameDiff(frames.prev, frames.curr);
        if(!diff){return};
        const totalPix = diff.imageData.data.length / 4;
        
        if (diff.count / totalPix < movementThreshold) { 
            return false; 
        }
        
        return this.detectGrid(diff.imageData);
    }

    detectGrid(imageData) {
        const pixels = imageData.data;
        const results = new Int32Array(this.size.x * this.size.y);
        // for each pixel, determine which quadrant it belongs to
        let i = 0;
        let j, px, py, gx, gy, exists;
        while (i < pixels.length / 4) {
            px = i % this.imageSize.x;
            py = Math.floor(i / this.imageSize.x);

            gx = Math.floor(py / this.cellSize.y);
            gy = Math.floor(px / this.cellSize.x);

            if (pixels[i * 4] == 255) {
                let ri = gx * this.size.x + gy;
                results[ri] += 1;
            }

            i++;
        }

        return results;
    }

    makeThresh(min) {
        return function(value) {
            return (value ^ (value >> 31)) - (value >> 31) > min ? 255 : 0;
        };
    }

    // diff two frames, return pixel diff data, boudning box of movement and count
    frameDiff(prev, curr) {
        if (prev == null || curr == null) { return false;};
        let r, g, b, a, avgP, avgC, diff, j, i;
        const p = prev.data;
        const c = curr.data;
        const thresh = this.makeThresh(this.pixelDiffThreshold);
        // thresholding function
        const pixels = new Uint8ClampedArray(p.length);

        let count = 0;

        // for each pixel, find if average excees thresh
        i = 0;
        while (i < p.length / 4) {
            j = i * 4;

            avgC = 0.2126 * c[j] + 0.7152 * c[j + 1] + 0.0722 * c[j + 2];
            avgP = 0.2126 * p[j] + 0.7152 * p[j + 1] + 0.0722 * p[j + 2];

            diff = thresh(avgC - avgP);

            pixels[j + 3] = diff;


            // if there is a difference, update bounds
            if (diff) {
                pixels[j] = diff;
                // count pix movement
                count++;
            }
            i++;
        }

        return {
            count: count,
            imageData: new ImageData(pixels, this.imageSize.x), };
    }
}
