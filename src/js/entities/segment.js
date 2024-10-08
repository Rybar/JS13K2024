export default class Segment {
    constructor(x, y, length, angle) {
      this.x = x; // base x
      this.y = y; // base y
      this.length = length;
      this.angle = angle;
      this.parent = null;
    }
  
    getEndX() {
      return this.x + Math.cos(this.angle) * this.length;
    }
  
    getEndY() {
      return this.y + Math.sin(this.angle) * this.length;
    }
  
    pointAt(x, y) {
      const dx = x - this.x;
      const dy = y - this.y;
      this.angle = Math.atan2(dy, dx);
    }
  
    drag(x, y) {
      this.pointAt(x, y);
      this.x = x - Math.cos(this.angle) * this.length;
      this.y = y - Math.sin(this.angle) * this.length;
      if (this.parent) {
        this.parent.drag(this.x, this.y);
      }
    }
  }