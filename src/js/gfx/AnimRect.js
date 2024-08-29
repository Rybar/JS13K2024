export default class AnimRect {
    /**
     * Creates an instance of AnimRect.
     * @constructor
     * @param {RetroBuffer} buffer - The RetroBuffer instance to draw on.
     * @param {number} x - The x-coordinate of the _rectangle.
     * @param {number} y - The y-coordinate of the _rectangle.
     * @param {number} width - The width of the _rectangle.
     * @param {number} height - The height of the _rectangle.
     * @param {number} startCorner - The starting corner (0: top-left, 1: top-right, 2: bottom-right, 3: bottom-left).
     * @param {number} direction - The direction of animation (-1 or 1).
     * @param {number} speed - The speed of the animation.
     * @param {number} color - The color of the _rectangle.
     */
    constructor(buffer, x, y, width, height, startCorner, direction, speed, color) {
        this.buffer = buffer;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.startCorner = startCorner;
        this.direction = direction;
        this.speed = speed;
        this.color = color;
        this.alive = true;
        this.progress = 0;

        this.perimeterLength = 2 * (width + height);
    }

    /**
     * Updates the animation progress.
     */
    update() {
        if (this.alive) {
            this.progress += this.speed;
            if (this.progress >= this.perimeterLength) {
                this.progress = this.perimeterLength;
                //this.alive = false;
            }
        }
    }

    /**
     * Draws the animated _rectangle on the buffer.
     */
    draw() {
        let remainingProgress = this.progress;

        const drawSegment = (x1, y1, x2, y2) => {
            const segmentLength = Math.abs(x2 - x1) + Math.abs(y2 - y1);
            if (remainingProgress > segmentLength) {
                this.buffer.line(x1, y1, x2, y2, this.color);
                remainingProgress -= segmentLength;
            } else {
                const dx = x2 - x1 !== 0 ? (x2 - x1) / Math.abs(x2 - x1) : 0;
                const dy = y2 - y1 !== 0 ? (y2 - y1) / Math.abs(y2 - y1) : 0;
                let xp = x1 + dx * remainingProgress;
                let yp = y1 + dy * remainingProgress;
                if (Math.abs(xp - x1) > 0 || Math.abs(yp - y1) > 0) {
                    this.buffer.line(x1, y1, xp, yp, this.color);
                }
                remainingProgress = 0;
            }
        };

        switch (this.startCorner) {
            case 0: // Top-left
                drawSegment(this.x, this.y, this.x + this.width, this.y);
                drawSegment(this.x + this.width, this.y, this.x + this.width, this.y + this.height);
                drawSegment(this.x + this.width, this.y + this.height, this.x, this.y + this.height);
                drawSegment(this.x, this.y + this.height, this.x, this.y);
                break;
            case 1: // Top-right
                drawSegment(this.x + this.width, this.y, this.x + this.width, this.y + this.height);
                drawSegment(this.x + this.width, this.y + this.height, this.x, this.y + this.height);
                drawSegment(this.x, this.y + this.height, this.x, this.y);
                drawSegment(this.x, this.y, this.x + this.width, this.y);
                break;
            case 2: // Bottom-right
                drawSegment(this.x + this.width, this.y + this.height, this.x, this.y + this.height);
                drawSegment(this.x, this.y + this.height, this.x, this.y);
                drawSegment(this.x, this.y, this.x + this.width, this.y);
                drawSegment(this.x + this.width, this.y, this.x + this.width, this.y + this.height);
                break;
            case 3: // Bottom-left
                drawSegment(this.x, this.y + this.height, this.x, this.y);
                drawSegment(this.x, this.y, this.x + this.width, this.y);
                drawSegment(this.x + this.width, this.y, this.x + this.width, this.y + this.height);
                drawSegment(this.x + this.width, this.y + this.height, this.x, this.y + this.height);
                break;
        }
    }
}

// Usage example:
