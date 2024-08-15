export default class Player {
    constructor(x,y) {
        this.width = 4;
        this.height = 8;
        this.oldX = x;
        this.oldY = y;
        this.x = x;
        this.y = y;
        this.alive = true;
        this.velocity = {x: 0, y: 0};
        this.acceleration = {x: 0, y: 0};
        this.drag = 0.8;
        this.speed = 0.3;
        this.isFiring = false;
        this.gremlinBlood = 0;
        
    }
    
    update() {
        this.oldX = this.x;
        this.oldY = this.y;

        this.velocity.x += this.acceleration.x;
        this.velocity.x *= this.drag;
        this.x += this.velocity.x;
        if(map.getTileAtPixel(this.x, this.y) === 0) {
            this.x = this.oldX;
        }
        //check right edge
        if(map.getTileAtPixel(this.x+this.width-1, this.y) === 0) {
            this.x = this.oldX;
        }

        this.velocity.y += this.acceleration.y;
        this.velocity.y *= this.drag;
        this.y += this.velocity.y;
        if(map.getTileAtPixel(this.x, this.y) === 0) {
            this.y = this.oldY;
        }
        //check top
        if(map.getTileAtPixel(this.x, this.y-this.height-1) === 0) {
            this.y = this.oldY;
        }

        this.acceleration.x = 0;
        this.acceleration.y = 0;
    }

    draw(r, view) {
        r.fRect(this.x - view.x, this.y - view.y-8, 4, 8, 22, 22);
        if (this.isFiring) {
            r.fRect(this.x - view.x, this.y - view.y-8, 8, 12, 22, 23);
        }
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
        this.isFiring = Key.isDown(Key.SPACE);
    }


}