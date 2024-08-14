export default class Player {
    constructor(x,y) {
        this.width = 2;
        this.height = 2;
        this.x = x;
        this.y = y;
        this.alive = true;
        this.velocity = {x: 0, y: 0};
        this.acceleration = {x: 0, y: 0};
        this.drag = 0.8;
        this.speed = 0.4;
        this.isFiring = false;
    }
    
    update() {
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.x *= this.drag;
        this.velocity.y *= this.drag;
        this.acceleration.x = 0;
        this.acceleration.y = 0;
        this.isFiring = false;
    }

    draw(r, view) {
        r.fRect(this.x - view.x, this.y - view.y, 1, 1, 22, 22);
    }

    handleInput(Key) {
        if (Key.isDown(Key.LEFT) || Key.isDown(Key.a)) {
            this.acceleration.x = -this.speed;
        } else if (Key.isDown(Key.RIGHT) || Key.isDown(Key.d)) {
            this.acceleration.x = this.speed;
        }
        if (Key.isDown(Key.UP) || Key.isDown(Key.w)) {
            this.acceleration.y = -this.speed;
        } else if (Key.isDown(Key.DOWN) || Key.isDown(Key.s)) {
            this.acceleration.y = this.speed;
        }
    }


}