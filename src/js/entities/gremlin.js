import { tileCollisionCheck } from "../core/utils";
import Splode from "../gfx/Splode";
import Powerup from "./Powerup";
export default class Gremlin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 8;
        this.oldX = x;
        this.oldY = y;
        this.alive = true;
        this.health = 30;
        this.velocity = {x: 0, y: 0};
        this.acceleration = {x: 0, y: 0};
        this.drag = 0.8;
        this.speed = 0.25;
        this.isFiring = false;

        this.targetTypes = {
            PLAYER: 1,
            TORCH: 2
        }
        this.target = {
            type: this.targetTypes.PLAYER,
            x: 0,
            y: 0
        }
    }

    update() {
        if(!this.alive) return;
        if(this.health <= 0) {
            this.die();
        }
        this.oldX = this.x;
        this.oldY = this.y;
        this.target.x = player.x;
        this.target.y = player.y;
        

        // Random wandering
        if (Math.random() < 0.1) {
            this.acceleration.x = (Math.random() - 0.5) * this.speed;
            this.acceleration.y = (Math.random() - 0.5) * this.speed;
        }

        //check player.currentRoom.altar for lit torches
        if(player.currentRoom.altar !== null) {
            player.currentRoom.altar.torches.some(torch => {
                if(torch.lit) {
                    this.target.type = this.targetTypes.TORCH;
                    this.target.x = torch.x;
                    this.target.y = torch.y;
                    return true;
                }
                else {
                    this.target.type = this.targetTypes.PLAYER;
                    this.target.x = player.x;
                    this.target.y = player.y;
                }
            });
        }
    
        // Chasing player or lit torch if close
        const distanceToTarget = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (distanceToTarget < 100) { // Arbitrary range
            this.acceleration.x += (this.target.x - this.x) * this.speed / distanceToTarget;
            this.acceleration.y += (this.target.y - this.y) * this.speed / distanceToTarget;
        }

        //if target is close, attack
        if (distanceToTarget < 10) {
            
            switch(this.target.type) {
                case this.targetTypes.PLAYER:
                    this.interactWithPlayer();
                    break;
                case this.targetTypes.TORCH:
                    if(player.currentRoom.altar !== null) {
                        player.currentRoom.altar.torches.forEach(torch => {
                            if(torch.x === this.target.x && torch.y === this.target.y) {
                                torch.health--;
                                this.health--;
                            }
                        });
                    }
                    break;
            }
        }

        //distance to player
        const distanceToPlayer = Math.hypot(this.x - player.x, this.y - player.y);
        if(distanceToPlayer < 8){
            this.interactWithPlayer();
        }

    
        this.velocity.x += this.acceleration.x;
        this.velocity.x *= this.drag;
        this.x += this.velocity.x;
        if (tileCollisionCheck(map, this)) {
            this.x = this.oldX; 
            this.velocity.x *= -1;
        }
    
        this.velocity.y += this.acceleration.y;
        this.velocity.y *= this.drag;
        this.y += this.velocity.y;
        if (tileCollisionCheck(map, this)) {
            this.y = this.oldY; 
            this.velocity.y *= -1;
        }
    
        this.acceleration.x = 0;
        this.acceleration.y = 0;
    }
    
    interactWithPlayer() {
        //calculate angle between player and gremlin
        const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        if(player.isFiring) {
            this.health--;
            this.acceleration.x = Math.cos(angle) * 2;
            this.acceleration.y = Math.sin(angle) * 2;
            }
        if(player.health > 0) {
            player.health-=.1;
            //push player away
            player.acceleration.x = Math.cos(angle) * player.maxSpeed;
            player.acceleration.y = Math.sin(angle) * player.maxSpeed;
        }
    }

    draw (r, view) {
        if(!this.alive) return;
        //body
        r.fRect(this.x - view.x, this.y - view.y-8, 4, 10, 16, 16);
        //horns
        r.fRect(this.x - view.x-2, this.y - view.y-10, 2, 2, 16, 16);
        r.fRect(this.x - view.x+4, this.y - view.y-10, 2, 2, 16, 16);
        //display health above gremlin
        r.text(`${this.health}`, this.x - view.x, this.y - view.y - 16, 1, 1, 'center', 'top', 1, 22);
    }

    die() {
        entitiesArray.push(new Splode(this.x, this.y, 50, 15));
        //throw out a random amount of Powerups
        const powerupCount = Math.floor(Math.random() * 3) + 1;
        for(let i = 0; i < powerupCount; i++) {
            entitiesArray.push(new Powerup(
                "GREMLIN_BLOOD",
                this.x + Math.random() * 20 + 8,
                this.y + Math.random() * 20 + 8
            ));
        }

        this.alive = false;
    }
}