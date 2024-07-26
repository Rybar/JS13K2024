export default class Splode {
    /**
     * Creates an instance of Splode.
     * @constructor
     * @param {RetroBuffer} buffer - the instance of 
     * @param {number} x - The x-coordinate of the explosion center.
     * @param {number} y - The y-coordinate of the explosion center.
     * @param {number} life - The lifespan of the explosion.
     * @param {number} color - The color of the explosion.
     */
    constructor(x, y, life, color) {
      this.x = x;
      this.y = y;
      this.lifeMax = life;
      this.life = life;
      this.alive = true;
      this.color = color;
    }
  
    /**
     * Updates the explosion's state.
     */
    update() {
      if (!this.alive) return;
      if (this.life > 0) {
        this.life -= 1;
      } else {
        this.alive = false;
      }
    }
  
    /**
     * Draws the explosion on the buffer.
     * @param {RetroBuffer} buffer - The RetroBuffer instance to draw on.
     * @param {object} view - The current view offset {x, y}.
     */
    draw(buffer, view) {
      buffer.pat = buffer.dither[15 - Math.floor((this.life / this.lifeMax) * 15)];
      for (let i = Math.floor(this.life / 10); i > 0; i--) {
        buffer.circle(this.x - view.x, this.y - view.y, this.lifeMax - this.life - i, this.color);
      }
      buffer.circle(this.x - view.x, this.y - view.y, this.lifeMax - this.life, this.color);
      buffer.pat = buffer.dither[0];
    }
  }
  