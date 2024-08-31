export default class AnimLine {
    /**
     * Creates an instance of AnimLine.
     * @constructor
     * @param {RetroBuffer} buffer - The RetroBuffer instance to draw on.
     * @param {number} x1 - The starting x-coordinate of the line.
     * @param {number} y1 - The starting y-coordinate of the line.
     * @param {number} x2 - The ending x-coordinate of the line.
     * @param {number} y2 - The ending y-coordinate of the line.
     * @param {number} color - The color of the line.
     * @param {number} speed - The speed of the animation.
     */
    constructor(buffer, x1, y1, x2, y2, color, speed) {
      this.buffer = buffer;
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this.color = color;
      this.speed = speed;
      this.alive = true;
      this.progress = 0;
  
      // Calculate the total length of the line
      this.totalLength = Math.hypot(x2 - x1, y2 - y1);
    }
  
    /**
     * Updates the animation progress.
     */
    update() {
      if (this.alive) {
        this.progress += this.speed;
        if (this.progress >= this.totalLength) {
          this.progress = this.totalLength;
          this.alive = false;
        }
      }
    }
  
    /**
     * Draws the animated line on the buffer.
     */
    draw() {
      if (!this.alive && this.progress >= this.totalLength) {
        this.buffer.line(this.x1, this.y1, this.x2, this.y2, this.color);
        return;
      }
  
      const progressRatio = this.progress / this.totalLength;
      const currentX = this.x1 + (this.x2 - this.x1) * progressRatio;
      const currentY = this.y1 + (this.y2 - this.y1) * progressRatio;
  
      this.buffer.line(this.x1, this.y1, currentX, currentY, this.color);
    }
  }
  