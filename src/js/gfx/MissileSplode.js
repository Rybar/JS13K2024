export default class MissileSplode {
  /**
   * Creates an instance of MissileSplode.
   * @constructor
   * @param {RetroBuffer} buffer - the instance of 
   * @param {number} x - The x-coordinate of the explosion center.
   * @param {number} y - The y-coordinate of the explosion center.
   * @param {number} life - The lifespan of the explosion.
   * @param {number} speed - The speed of the explosion 
   * @param {number} color - The color of the explosion.
   */
  constructor(x, y, life, color, speed=0.25) {
    this.x = x;
    this.y = y;
    this.lifeMax = life;
    this.speed = speed;
    this.life = life;
    this.alive = true;
    this.color = color;
    this.radius = life;
  }

  /**
   * Updates the explosion's state.
   */
  update() {
    if (!this.alive) return;
    if (this.life > 0) {
      this.life -= (1 * this.speed);
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
    buffer.pat = buffer.dither[8];
    for (let i = Math.floor(this.life / 10); i > 0; i--) {
      buffer.circle(this.x - view.x, this.y - view.y, this.lifeMax - this.life - i, this.color);
    }
    buffer.circle(this.x - view.x, this.y - view.y, this.lifeMax - this.life, this.color);
    buffer.pat = buffer.dither[0];
  }
}
