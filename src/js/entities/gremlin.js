
import { tileCollisionCheck, rand, randFloat, rectangle, lightRadial, playSound, choice } from "../core/utils";
import Splode from "../gfx/Splode";
import Powerup from "./Powerup";
import Particle from './particle.js';
import Arm from "./arm";

export default class Gremlin {
    constructor(x, y, brute = false) {
        this.brute = brute;
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 10;
        this.oldX = x;
        this.oldY = y;
        this.alive = true;
        this.health = 30;
        this.velocity = {x: 0, y: 0};
        this.acceleration = {x: 0, y: 0};
        this.drag = 0.8;
        this.speed = 0.25;
        this.maxSpeed = 0.3;
        this.attackRange = 50;
        this.attackCooldown = 1000;
        this.attackTelegraphTime = 500;
        this.isAttacking = false;
        this.attackBox = new rectangle(0, 0, 0, 0);
        this.lastAttackTime = 0;
        this.telegraphStartTime = 0;
        this.damage = 10;
        this.isFiring = false;
        this.rectangle = new rectangle(this.x, this.y, this.width, this.height);
        this.currentRoom = null;
        this.angleToPlayer = 0;
        this.stepFrameCount = 0; // Counter for alternating legs

        if(brute) {
            this.width = 20;
            this.height = 12;
            this.speed = 0.1;
            this.maxSpeed = 0.2;
            this.health = 50;
            this.damage = 20;
            this.attackRange = 60;
            this.attackCooldown = 2000;
            this.attackTelegraphTime = 1000;
        }
        this.targetTypes = {
            P: 1,
            TORCH: 2
        };
        this.target = {
            type: this.targetTypes.P,
            x: P.x,
            y: P.y
        };
         // Create legs as Arms with 2 Segments each
        this.legs = [
            new Arm(this.x, this.y + this.height), // Left leg
            new Arm(this.x, this.y + this.height), // Right leg
            new Arm(this.x, this.y + this.height), // Left leg
            new Arm(this.x, this.y + this.height)  // Right leg
        ];
        // Add segments to each leg
        if(brute) {
            this.legs.forEach(leg => {
                leg.addSegment(10); // Upper segment
                leg.addSegment(10); // Lower segment
                leg.addSegment(10); // Lower segment
            });
        }else {
        this.legs.forEach(leg => {
            leg.addSegment(4); // Upper segment
            leg.addSegment(4); // Lower segment
            leg.addSegment(4); // Lower segment
        });
        }
        this.legTargets = [
            { x: this.x, y: this.y },
            { x: this.x, y: this.y },
            { x: this.x, y: this.y },
            { x: this.x, y: this.y }
        ];
    }

    draw(r, view) {
        if (!this.alive) return;
        //laser sight if about to attack
        if (this.isAttacking) {
            r.line(this.x-view.x, this.y-view.y, this.target.x-view.x, this.target.y-view.y, choice([10,11,12,13]));
        }

        //body
        r.fRect(this.x - view.x, this.y - view.y, this.width, this.height, 16, 16);
        r.fCircle(this.x + this.width / 2 - view.x, this.y - view.y, this.width / 2, 16);
        lightRadial(this.x - view.x, this.y - view.y, 30, [2, 4]);

        const hornColor = this.isAttacking ? choice([10,11,12,13]) : 16;
        const hornWidth = this.brute? 4 : 2;
        const hornHeight = this.brute? 6 : 4;
        r.fRect(this.x - view.x - 2, this.y - view.y - 2, hornWidth, hornHeight, hornColor);
        r.fRect(this.x - view.x + this.width-2, this.y - view.y - 2, hornWidth, hornHeight, hornColor);

        //eyes if brute
        if(this.brute) {
            r.fRect(this.x - view.x + 2, this.y - view.y + 2, 2, 2, 22);
            r.fRect(this.x - view.x + this.width - 4, this.y - view.y + 2, 2, 2, 22);
        }
        // Draw the legs
        this.legs.forEach(leg => leg.segments.forEach(segment => {
            r.line(segment.x - view.x, segment.y - view.y, segment.getEndX() - view.x, segment.getEndY() - view.y, 16);
        }));

        r.text(`${this.health}`, this.x - view.x, this.y - view.y - 16, 1, 1, 'center', 'top', 1, 22);

        // //debug rectangle
        // r.fRect(this.x - view.x, this.y - view.y, this.width, this.height, 10);
        // //debug corners
        // r.fRect(this.x - view.x, this.y - view.y, 1, 1, 10);
        // r.fRect(this.x - view.x + this.width, this.y - view.y, 1, 1, 11);
        // r.fRect(this.x - view.x, this.y - view.y + this.height, 1, 1, 12);

    }

    update() {
        if (!this.alive) return;
        this.angleToPlayer = Math.atan2(P.y - this.y, P.x - this.x);
        if(this.currentRoom !== P.currentRoom) {
            if(this.target.type === this.targetTypes.TORCH) {
                this.target.type = this.targetTypes.P;
            }
            this.currentRoom = P.currentRoom;
        }

        if (this.health <= 0) {
            this.die();
        }

        const now = Date.now();

        if (this.isAttacking) {
            let timeRemaining = this.attackTelegraphTime - (now - this.telegraphStartTime);
            if (timeRemaining <= 0) {
                
                this.performAttack();
            }
        }

        this.oldX = this.x;
        this.oldY = this.y;


        this.seekTarget();
        this.seekWithObstacleAvoidance();
        this.determineDirection();
        
        // Update leg positions
        this.updateLegTargets();
        this.stepFrameCount++;

        // Update the legs
        this.legs.forEach((leg, index) => {
            //4 legs, attach to roughly the corners of the gremlin
            leg.x = this.x + (this.width/4 * index);
            leg.y = this.y + this.height;
            leg.target = this.legTargets[index]; // Update target

            // Update leg if the step frame count is appropriate
            if (this.stepFrameCount > this.legStepOffset * index) {
                leg.update();
            }
        });

        // Initiate attack telegraph if within range and cooldown passed
        const distanceToTarget = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (distanceToTarget <= this.attackRange && now - this.lastAttackTime >= this.attackCooldown && !this.isAttacking) {
            this.startAttackTelegraph();
        } else {
            this.randomWander();
        }

        this.collideWithPlayer();

        // Check for collision with P's attack box and apply damage
        this.checkPlayerAttack();

        this.applyMovement();
    }

    determineDirection() {
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            const magnitude = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            const normalizedX = this.velocity.x / magnitude;
            const normalizedY = this.velocity.y / magnitude;

            if (Math.abs(normalizedX) > Math.abs(normalizedY)) {
                this.direction = normalizedX > 0 ? 'right' : 'left';
            } else {
                this.direction = normalizedY > 0 ? 'down' : 'up';
            }
        }
    }

    updateLegTargets() {
       
        var offset = 12; // Distance ahead of the P for the leg targets
        var verticalOffset = 6; // Vertical offset for the leg targets
        let targetX, targetY;
        this.stepDistance = 30; // Minimum distance before a leg takes a step
        this.legStepOffset = 5; // Offset in frames for alternating leg movement

        if(this.brute){
            offset = 20;
            verticalOffset = 10;
            this.stepDistance = 40;
            this.legStepOffset = 10;
        }

        switch (this.direction) {
            case 'up':
                targetX = this.x;
                targetY = this.y + this.height + verticalOffset;
                break;
            case 'down':
                targetX = this.x;
                targetY = this.y + this.height + verticalOffset;
                break;
            case 'left':
                targetX = this.x - offset;
                targetY = this.y + this.height + verticalOffset;
                break;
            case 'right':
                targetX = this.x + offset;
                targetY = this.y + this.height + verticalOffset;
                break;
        }

        // Update the targets for each leg only if the Player has moved sufficiently
        this.legs.forEach((leg, index) => {
            const legTarget = this.legTargets[index];
            const distance = Math.hypot(targetX - legTarget.x, targetY - legTarget.y);
            if (distance > this.stepDistance) {
                this.legTargets[index] = { x: targetX + (index === 0 ? 0 : 3), y: targetY };
                playSound(sounds.footstep, 1, 0, 0.1)
            }
        });
    }


    collideWithPlayer() {
        if (this.rectangle.intersects(P.rectangle)) {
            if(P.isInvincible) {
                this.health -= 1;
                return;
            }
            P.health -= 1;
            let knockbackForce = 4;
            P.acceleration.x += Math.cos(this.angleToPlayer) * knockbackForce;
            P.acceleration.y += Math.sin(this.angleToPlayer) * knockbackForce;
        }
    }

    checkPlayerAttack() {
        if (P.isFiring && this.rectangle.intersects(P.attackBox)) {
            this.health -= P.attackDamage; 
            let knockbackForce = 24;
            this.velocity.x =  - Math.cos(this.angleToPlayer) * knockbackForce;
            this.velocity.y = - Math.sin(this.angleToPlayer) * knockbackForce;
           playSound(sounds.gremlinHurt); 
        }
    }

    raycast(x0, y0, x1, y1, map) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;
    
        while (true) {
            if (tileCollisionCheck(map, { x: x0, y: y0, width: 1, height: 1 })) {
                return true; // Collision with a wall
            }
    
            if ((x0 === x1) && (y0 === y1)) break;
            let e2 = err * 2;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    
        return false; // No collision
    }

    seekWithObstacleAvoidance() {
        const dirX = this.target.x - this.x;
        const dirY = this.target.y - this.y;
        const distance = Math.hypot(dirX, dirY);
    
        if (distance > 0) {
            this.acceleration.x = (dirX / distance) * this.speed;
            this.acceleration.y = (dirY / distance) * this.speed;
        }
    
        // Check if there's a wall in the way
        if (this.raycast(this.x, this.y, this.target.x, this.target.y, map)) {
            // There's a wall, so we need to steer around it
            let angleOffset = 0.1; // Angle to try avoiding the wall
    
            // Try turning slightly left
            let leftAngle = Math.atan2(dirY, dirX) - angleOffset;
            let leftX = this.x + Math.cos(leftAngle) * this.speed;
            let leftY = this.y + Math.sin(leftAngle) * this.speed;
    
            if (!this.raycast(this.x, this.y, leftX, leftY, map)) {
                this.acceleration.x = Math.cos(leftAngle) * this.speed;
                this.acceleration.y = Math.sin(leftAngle) * this.speed;
            } else {
                // If turning left didn't work, try turning right
                let rightAngle = Math.atan2(dirY, dirX) + angleOffset;
                let rightX = this.x + Math.cos(rightAngle) * this.speed;
                let rightY = this.y + Math.sin(rightAngle) * this.speed;
    
                if (!this.raycast(this.x, this.y, rightX, rightY, map)) {
                    this.acceleration.x = Math.cos(rightAngle) * this.speed;
                    this.acceleration.y = Math.sin(rightAngle) * this.speed;
                }
            }
        }
    }
    
    

    seekTarget() {
        // If the current room has an altar and it's not anointed, target the nearest torch
        if (P.currentRoom.altar && !P.currentRoom.altar.annointed) {
            let nearestTorch = null;
            let minDistance = Infinity;

            for (const torch of P.currentRoom.altar.torches) {
                if(torch.lit) {
                    const distanceToTorch = Math.hypot(torch.x - this.x, torch.y - this.y);
                    if (distanceToTorch < minDistance && torch.health > 0) {
                        nearestTorch = torch;
                        minDistance = distanceToTorch;
                    }
                } 
            }

            if (nearestTorch) {
                this.target.type = this.targetTypes.TORCH;
                this.target.x = nearestTorch.x;
                this.target.y = nearestTorch.y;

                const dirX = this.target.x - this.x;
                const dirY = this.target.y - this.y;
                const distance = Math.hypot(dirX, dirY);
        
                if (distance > 0) {
                    this.acceleration.x = (dirX / distance) * this.speed;
                    this.acceleration.y = (dirY / distance) * this.speed;
                }

                return;
            }
        }

        // If no torch to target, seek the Player
        this.target.type = this.targetTypes.P;
        this.target.x = P.x;
        this.target.y = P.y;

        const dirX = this.target.x - this.x;
        const dirY = this.target.y - this.y;
        const distance = Math.hypot(dirX, dirY);

        if (distance > 0) {
            this.acceleration.x = (dirX / distance) * this.speed;
            this.acceleration.y = (dirY / distance) * this.speed;
        }
    }

    randomWander() {
        if (Math.random() < 0.1) {
            this.acceleration.x = (Math.random() - 0.5) * this.speed;
            this.acceleration.y = (Math.random() - 0.5) * this.speed;
        }
    }

    startAttackTelegraph() {
        if(!this.isAttacking) {
            playSound(sounds.gremlinAttack, randFloat(0.9,1.1), 0, 0.1);
        }
        this.isAttacking = true;
        this.telegraphStartTime = Date.now();
        this.acceleration.x = 0;
        this.acceleration.y = 0;
    }

    performAttack() {
        console.log('performing attack');
        this.isAttacking = false;
        this.lastAttackTime = Date.now();
        // Perform attack logic based on target type
        if (this.target.type === this.targetTypes.P && !P.isFiring) {
            console.log('attack target is player...');
            if (Math.hypot(P.x - this.x, P.y - this.y) <= this.attackRange) {
                console.log('player in range...');
                P.health -= this.damage; 
                let knockbackForce = 6;
                P.acceleration.x += Math.cos(this.angleToPlayer) * knockbackForce;
                P.acceleration.y += Math.sin(this.angleToPlayer) * knockbackForce;
                playSound(sounds.playerHurt);
                //spawn a bunch of particles along a line between the P and the gremlin
                let i = 100;
                while(i--){
                    let dx = P.x - this.x;
                    let dy = P.y - this.y;
                    let x = this.x + dx * i / 100;
                    let y = this.y + dy * i / 100;
                    entitiesArray.push(new Particle(
                        x + randFloat(-2,2), y + randFloat(-2,2),
                        randFloat(-0.5,0.5),
                        randFloat(-0.5,0.5),
                        {color: [22,8,7,6,5,4,3,2,1], life: 40,
                        customUpdate: (p) => {
                            p.xVelocity += (Math.random() - 0.5) * 0.3; 
                            p.yVelocity += (Math.random() - 0.5) * 0.3; 
                        }
                    }));
                }

                //playSound('hit'); // Assuming there's a sound effect for hitting
            }
        } else if (this.target.type === this.targetTypes.TORCH) {
            for (const torch of P.currentRoom.altar.torches) {
                console.log('checking torch');
                if (torch.x === this.target.x && torch.y === this.target.y) {
                    console.log('extinguishing torch');
                    torch.health -= 20; // Reduce torch health
                    if (torch.health <= 0) {
                       playSound(sounds.footstep, 0.5, 0, 0.8); // Assuming there's a sound effect for extinguishing torches
                    }
                }
            }
        }
    }

    separate(enemy, enemies, desiredSeparation) {
        let steer = { x: 0, y: 0 };
        let count = 0;
    
        // For every nearby enemy, check if it's too close
        for (let other of enemies) {
            let distance = Math.sqrt(
                (enemy.x - other.x) * (enemy.x - other.x) +
                (enemy.y - other.y) * (enemy.y - other.y)
            );
    
            if (distance > 0 && distance < desiredSeparation) {
                // Calculate vector pointing away from the nearby enemy
                let diff = {
                    x: enemy.x - other.x,
                    y: enemy.y - other.y
                };
    
                // Normalize and weight by distance
                diff.x /= distance;
                diff.y /= distance;
                steer.x += diff.x;
                steer.y += diff.y;
                count++;
            }
        }
    
        // Average out the forces and scale
        if (count > 0) {
            steer.x /= count;
            steer.y /= count;
    
            let magnitude = Math.sqrt(steer.x * steer.x + steer.y * steer.y);
            if (magnitude > 0) {
                steer.x /= magnitude;
                steer.y /= magnitude;
    
                steer.x *= enemy.maxSpeed;
                steer.y *= enemy.maxSpeed;
            }
    
            steer.x -= enemy.velocity.x;
            steer.y -= enemy.velocity.y;
        }
    
        return steer;
    }
    

    applyMovement() {
        this.separateForce = this.separate(this, gremlinsArray, 20);

        this.acceleration.x += this.separateForce.x;
        this.acceleration.y += this.separateForce.y;

        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;



        this.velocity.x *= this.drag;
        this.velocity.y *= this.drag;

               

        this.x += this.velocity.x;
        if(tileCollisionCheck(map, this)) {
            this.x = this.oldX;
            this.velocity.x = 0;
        }

        this.y += this.velocity.y;
        if(tileCollisionCheck(map, this)) {
            this.y = this.oldY;
            this.velocity.y = 0;
        }

        this.rectangle.x = this.x;
        this.rectangle.y = this.y;


    }

    die() {
        this.alive = false;
        entitiesArray.push(new Splode(this.x, this.y, 50, 5));
        let i = rand(2, 5);
        while(i--) {
            entitiesArray.push(new Particle(this.x, this.y, randFloat(-0.1, 0.1), randFloat(-0.1, 0.1), {color: [16, 15, 14, 13, 12, 11], life: 50}));
            entitiesArray.push(new Powerup('GREMLINBLOOD', this.x + randFloat(-10, 10), this.y+ randFloat(-10, 10)));
        }
        }
}