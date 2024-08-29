import { tileCollisionCheck, Rectangle, lightRadial, playSound, randFloat, rand } from "../core/utils";
import Arm from "./arm";
import Particle from "./particle";

export default class P {

    constructor(x, y) {
        this.width = 4;
        this.height = 4; 
        this.oldX = x;
        this.oldY = y;
        this.x = x;
        this.y = y;
        this.alive = true;
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.drag = 0.8;
        this.speed = 0.35;
        this.maxSpeed = 0.6;
        this.isFiring = false;
        this.gremlinBlood = 0;
        this.currentRoom = null;
        this.health = 100;
        this.maxHealth = 100;
        this.completeAltarTorchCount = 0;
        this.rectangle = new Rectangle(this.x, this.y, this.width, this.height);
        this.bodyColor = 22;
        this.attackBoxColor = 8;
        this.attackDamage = 5;
        this.attackCoolDown = 0;
        
        

        this.direction = 'down'; // Track the direction the P is facing
        this.directionAngles = {
            up: -Math.PI / 2,
            down: Math.PI / 2,
            left: Math.PI,
            right: 0
        }
        this.attackBox = new Rectangle(this.x, this.y, 0, 0);; // Placeholder for the attack box

        // Create legs as Arms with 2 Segments each
        this.legs = [
            new Arm(this.x, this.y + this.height), // Left leg
            new Arm(this.x, this.y + this.height)  // Right leg
        ];

        // Add segments to each leg
        this.legs.forEach(leg => {
            leg.addSegment(4); // Upper segment
            leg.addSegment(4); // Lower segment
        });

        this.legTargets = [{ x: this.x, y: this.y + 8 }, { x: this.x, y: this.y }];
        //this.stepDistance = 10; // Minimum distance before a leg takes a step
        //this.legStepOffset = 120; // Offset in frames for alternating leg movement
        this.stepFrameCount = 0; // Counter for alternating legs
    }

    update() {
        this.oldX = this.x;
        this.oldY = this.y;

        this.velocity.x += this.acceleration.x;
        this.velocity.x *= this.drag;
        this.x += this.velocity.x;
        if (tileCollisionCheck(map, this)) {
            this.x = this.oldX;
        }

        this.velocity.y += this.acceleration.y;
        this.velocity.y *= this.drag;
        this.y += this.velocity.y;
        if (tileCollisionCheck(map, this)) {
            this.y = this.oldY;
        }

        this.determineDirection();

        // Update leg positions
        this.updateLegTargets();
        this.stepFrameCount++;

        // Update the legs
        this.legs.forEach((leg, index) => {
            leg.x = this.x + (index === 0 ? 0 : 3); // Attach legs to the sides of the P
            leg.y = this.y + this.height; // Attach legs to the bottom of the P
            leg.target = this.legTargets[index]; // Update target

            // Update leg if the step frame count is appropriate
            if (this.stepFrameCount > this.legStepOffset * index) {
                leg.update();
            }
        });

        // Update attack box if firing
        if (this.isFiring) {
            this.updateAttackBox();
            //emit particles along a circular 90 degree arc in the direction the P is facing
            //direction is set at this.direction, left, right, up, down
            for(let i = 0; i < 60; i++) {
                let angle = this.directionAngles[this.direction] + Math.random() * Math.PI / 2 - Math.PI / 4;
                let particle = new Particle(
                    this.x + Math.cos(angle) * 20 + rand(-3, 3),
                    this.y + Math.sin(angle) * 20 + rand(-3, 3),
                    this.velocity.x + Math.cos(angle),
                    this.velocity.y + Math.sin(angle), 
                    {
                        color: [22,21,20,19,18],
                        life: 15,
                        customUpdate: function(p) {
                            p.xVelocity += randFloat(-0.3, 0.3);
                            p.yVelocity += randFloat(-0.3, 0.3);
                        }
                    })
                entitiesArray.push(particle);
            }

        } else {
            this.attackBox.width = 0;
            this.attackBox.height = 0;
        }

        this.acceleration.x = 0;
        this.acceleration.y = 0;

        //update rectangle
        this.rectangle.x = this.x;
        this.rectangle.y = this.y;
    }

    draw(r, view) {
        // Draw the legs
        this.legs.forEach(leg => leg.segments.forEach(segment => {
            r.line(segment.x - view.x, segment.y - view.y, segment.getEndX() - view.x, segment.getEndY() - view.y, this.bodyColor);
        }));

        // Draw body (with head and attack box)
        r.fRect(this.x - view.x, this.y - view.y-4, this.width, 8, this.bodyColor);

        // Draw attack box if firing
        // if (this.isFiring && this.attackBox) {
        //     r.fRect(this.attackBox.x - view.x, this.attackBox.y - view.y, this.attackBox.width, this.attackBox.height, this.attackBoxColor);
        // }
        
        lightRadial(this.x - view.x + 2, this.y - view.y + 2, 50, [0,1,2,3,4]);

        // //debug corners
        // r.fRect(this.x - view.x, this.y - view.y, 1, 1, 18);
        // r.fRect(this.x - view.x + this.width, this.y - view.y, 1, 1, 18);
        // r.fRect(this.x - view.x, this.y - view.y + this.height, 1, 1, 18);
        // r.fRect(this.x - view.x + this.width, this.y - view.y + this.height, 1, 1, 18);

        // //debug rectangle
        // r.fRect(this.rectangle.x - view.x, this.rectangle.y - view.y, this.rectangle.width, this.rectangle.height, 10);
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

    updateLegTargets() {
        const offset = 6; // Distance ahead of the P for the leg targets
        const verticalOffset = 6; // Vertical offset for the leg targets
        let targetX, targetY;
        this.stepDistance = 16; // Minimum distance before a leg takes a step
        this.legStepOffset = 8; // Offset in frames for alternating leg movement

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

        // Update the targets for each leg only if the P has moved sufficiently
        this.legs.forEach((leg, index) => {
            const legTarget = this.legTargets[index];
            const distance = Math.hypot(targetX - legTarget.x, targetY - legTarget.y);
            if (distance > this.stepDistance) {
                this.legTargets[index] = { x: targetX + (index === 0 ? 0 : 3), y: targetY };
                playSound(sounds.footstep, 1, 0, 0.1)
            }
        });
    }

    updateAttackBox() {
        const attackSize = 8; // Adjust the size as needed
        switch (this.direction) {
            case 'up':
                this.attackBox.x = this.x - 10;
                this.attackBox.y = this.y - 16;
                this.attackBox.width = 24;
                this.attackBox.height = 8;
                break;
            case 'down':
                this.attackBox.x = this.x - 10;
                this.attackBox.y = this.y + this.height + 8;
                this.attackBox.width = 24;
                this.attackBox.height = 8;
                break;
            case 'left':
                this.attackBox.x = this.x - 14;
                this.attackBox.y = this.y - 8;
                this.attackBox.width = 8;
                this.attackBox.height = 24;
                break;
            case 'right':
                this.attackBox.x = this.x + 14;
                this.attackBox.y = this.y - 8;
                this.attackBox.width = 8;
                this.attackBox.height = 24;
                break;
        }
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

}
