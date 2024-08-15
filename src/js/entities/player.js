import { tileCollisionCheck } from "../core/utils";
export default class Player {

    constructor(x,y) {
        this.width = 4;
        this.height = 4;
        this.oldX = x;
        this.oldY = y;
        this.x = x;
        this.y = y;
        this.alive = true;
        this.velocity = {x: 0, y: 0};
        this.acceleration = {x: 0, y: 0};
        this.drag = 0.8;
        this.speed = 0.35;
        this.isFiring = false;
        this.gremlinBlood = 0;
        this.currentRoom = null;
        this.health = 100;
        this.completeAltarTorchCount = 0;

    }
    
    update() {
        this.oldX = this.x;
        this.oldY = this.y;

        this.velocity.x += this.acceleration.x;
        this.velocity.x *= this.drag;
        this.x += this.velocity.x;
        if(tileCollisionCheck(map, this)) {
            this.x = this.oldX;
        }

        this.velocity.y += this.acceleration.y;
        this.velocity.y *= this.drag;
        this.y += this.velocity.y;
        if(tileCollisionCheck(map, this)) {
            this.y = this.oldY;
        }

        this.acceleration.x = 0;
        this.acceleration.y = 0;
    }

    draw(r, view) {
        r.fRect(this.x - view.x, this.y - view.y-8, 4, 8, 22, 22);
        if (this.isFiring) {
            r.fRect(this.x - view.x-2, this.y - view.y-8, 8, 12, 22, 23);
        }
        //display health above player
        r.text(`${this.health.toFixed(2)}\nGB: ${this.gremlinBlood}`, this.x - view.x, this.y - view.y - 20, 1, 1, 'center', 'top', 1, 22);
    }

    handleInput(Key) {
        if (Key.isDown(Key.LEFT) || Key.isDown(Key.a) || Key.isDown(Key.q)) {
            this.acceleration.x = -this.speed;
        } else if (Key.isDown(Key.RIGHT) || Key.isDown(Key.d)) {
            this.acceleration.x = this.speed;
        }
        if (Key.isDown(Key.UP) || Key.isDown(Key.w) || Key.isDown(Key.z)) {
            this.acceleration.y = -this.speed;
        } else if (Key.isDown(Key.DOWN) || Key.isDown(Key.s)) {
            this.acceleration.y = this.speed;
        }
        this.isFiring = Key.isDown(Key.SPACE);
    }

    


}