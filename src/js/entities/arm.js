import Segment from './segment.js';
export default class Arm {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.segments = [];
      this.lastSegment = null;
      this.target = { x: 0, y: 0 };
    }
  
    addSegment(length) {
      let segment = new Segment(0, 0, length, 0);
      if (this.lastSegment) {
        segment.x = this.lastSegment.getEndX();
        segment.y = this.lastSegment.getEndY();
        segment.parent = this.lastSegment;
      } else {
        segment.x = this.x;
        segment.y = this.y;
      }
      this.segments.push(segment);
      this.lastSegment = segment;
    }
  
    draw() {
      this.segments.forEach(segment => segment.draw());
    }
  
    drag(x, y) {
      this.lastSegment.drag(x, y);
    }
  
    reach(x, y) {
      this.drag(x, y);
      this.segments.forEach(segment => {
        if (segment.parent) {
          segment.x = segment.parent.getEndX();
          segment.y = segment.parent.getEndY();
        } else {
          segment.x = this.x;
          segment.y = this.y;
        }
      })
    }
  
    update() {
      this.reach(this.target.x, this.target.y);
    }
  
  }