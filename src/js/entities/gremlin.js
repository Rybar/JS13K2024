export default class Gremlin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 8;
        this.oldX = x;
        this.oldY = y;
        this.alive = true;
        this.velocity = {x: 0, y: 0};
        this.acceleration = {x: 0, y: 0};
        this.drag = 0.8;
        this.speed = 0.1;
        this.isFiring = false;
    }

    update() {
        this.oldX = this.x;
        this.oldY = this.y;
        let playerX = player.x; 
        let playerY = player.y;
        // Random wandering
        if (Math.random() < 0.05) {
            this.acceleration.x = (Math.random() - 0.5) * this.speed;
            this.acceleration.y = (Math.random() - 0.5) * this.speed;
        }
    
        // Chasing player if close
        const distanceToPlayer = Math.hypot(playerX - this.x, playerY - this.y);
        if (distanceToPlayer < 100) { // Arbitrary range
            this.acceleration.x += (playerX - this.x) * this.speed / distanceToPlayer;
            this.acceleration.y += (playerY - this.y) * this.speed / distanceToPlayer;
        }
    
        this.velocity.x += this.acceleration.x;
        this.velocity.x *= this.drag;
        this.x += this.velocity.x;
        if (map.getTileAtPixel(this.x, this.y) === 0 || map.getTileAtPixel(this.x + this.width - 1, this.y) === 0) {
            this.x = this.oldX; 
            this.velocity.x *= -1;
        }
    
        this.velocity.y += this.acceleration.y;
        this.velocity.y *= this.drag;
        this.y += this.velocity.y;
        if (map.getTileAtPixel(this.y, this.y - this.height - 1) === 0 || map.getTileAtPixel(this.x, this.y) === 0) {
            this.y = this.oldY; 
            this.velocity.y *= -1;
        }
    
        this.acceleration.x = 0;
        this.acceleration.y = 0;
    }
    

    draw (r, view) {
        r.fRect(this.x - view.x, this.y - view.y-8, 4, 10, 16, 16);
    }
}