export default class Player {
    constructor(x,y) {
        this.x = x;
        this.y = y;
        this.alive = true;
        this.velocity = {x: 0, y: 0};
        this.acceleration = {x: 0, y: 0};
        this.drag = 0.9;
    }
    
    update() {
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.x *= this.drag;
        this.velocity.y *= this.drag;
    }

    draw(r, view) {
        r.fRect(this.x - view.x, this.y - view.y, 10, 10, 4, 4);
        console.log(`drawing player at ${this.x}, ${this.y}`);
    }
}