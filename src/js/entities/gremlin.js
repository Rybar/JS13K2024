import { tileCollisionCheck, rand, randFloat, Rectangle, lightRadial, playSound } from "../core/utils";
import Splode from "../gfx/Splode";
import Powerup from "./Powerup";
import Particle from './particle.js';
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
        this.attackRange = 12;
        this.attackCooldown = 1000;
        this.attackTelegraphTime = 500;
        this.isAttacking = false;
        this.attackBox = new Rectangle(0, 0, 0, 0);
        this.lastAttackTime = 0;
        this.telegraphStartTime = 0;
        this.damage = 10;
        this.isFiring = false;
        this.rectangle = new Rectangle(this.x, this.y, this.width, this.height);

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

    draw (r, view) {
        if(!this.alive) return;
        //body
        r.fRect(this.x - view.x, this.y - view.y-8, 8, 10, 16, 16);
        lightRadial(this.x - view.x, this.y - view.y, 30, [2, 4]);
        //horns
        const hornColor = this.isAttacking ?  6 : 16;
        r.fRect(this.x - view.x-2, this.y - view.y-10, 2, 4, hornColor);
        r.fRect(this.x - view.x+4, this.y - view.y-10, 2, 4, hornColor);
        //display health above gremlin
        r.text(`${this.health}`, this.x - view.x, this.y - view.y - 16, 1, 1, 'center', 'top', 1, 22);
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

        entitiesArray.push(new Particle(
            this.x+4 + rand(-3, 3), this.y-10,
            randFloat(-0.1,0.1), -0.25,
            {color: 1, life: 15,
                customUpdate: function(p) {
                    p.xVelocity += randFloat(-0.1,0.1);
                    p.yVelocity += randFloat(-0.1,0.1);
                }
            }));        

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
                                //this.health--;
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

        this.rectangle.x = this.x;
        this.rectangle.y = this.y;
    }
    
    // In the Gremlin class (inside interactWithPlayer or update method):
interactWithPlayer() {
    if (player.isFiring && player.attackBox) {
        // Check collision between attack box and gremlin's rectangle
        if (player.attackBox.intersects(this.rectangle)) {
            // Decrease gremlin health
            this.health -= 20; // Adjust damage value as needed

            // Calculate knockback direction based on player's facing direction
            const knockbackForce = 4; // Adjust the force of knockback
            switch (player.direction) {
                case 'up':
                    this.acceleration.y = -knockbackForce;
                    break;
                case 'down':
                    this.acceleration.y = knockbackForce;
                    break;
                case 'left':
                    this.acceleration.x = -knockbackForce;
                    break;
                case 'right':
                    this.acceleration.x = knockbackForce;
                    break;
            }
            
            // Add visual feedback for the hit (e.g., particle effect, sound)
            entitiesArray.push(new Splode(this.x, this.y, 25, 5,64));
            playSound(sounds.gremlinHurt);
        }
    } else {
        const knockbackForce = 1; // Adjust the force of knockback
        switch (player.direction) {
            case 'up':
                player.acceleration.y = -knockbackForce;
                break;
            case 'down':
                player.acceleration.y = knockbackForce;
                break;
            case 'left':
                player.acceleration.x = -knockbackForce;
                break;
            case 'right':
                player.acceleration.x = knockbackForce;
                break;
        }
        playSound(sounds.playerHurt);
    }
    

    if (this.health <= 0) {
        this.die();
    }
}




    die() {
        entitiesArray.push(new Splode(this.x, this.y, 50, 11,64));
        //throw out a random amount of Powerups
        const powerupCount = Math.floor(Math.random() * 5) + 1;
        for(let i = 0; i < powerupCount; i++) {
            entitiesArray.push(new Powerup(
                "GREMLIN_BLOOD",
                this.x + Math.random() * 20 + 8,
                this.y + Math.random() * 20 + 8
            ));
            entitiesArray.push(new Powerup(
                "HEALTH",
                this.x + Math.random() * 20 + 8,
                this.y + Math.random() * 20 + 8
            ));
        }

        this.alive = false;
    }

    updateAttackBox() {
        // Update the attack box based on the gremlin's current position
        const attackSize = 8;
        this.attackBox.x = this.x;
        this.attackBox.y = this.y;
        this.attackBox.width = attackSize;
        this.attackBox.height = attackSize;
    }

    canAttack() {
        // Check if gremlin can attack again based on the cooldown
        return performance.now() - this.lastAttackTime >= this.attackCooldown;
    }

    startAttack() {
        this.isAttacking = true;
        this.telegraphStartTime = performance.now();
        // Change color or show some visual cue
    }

    
}