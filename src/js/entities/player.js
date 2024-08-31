import { tileCollisionCheck, _rectangle, lightRadial, playSound, randFloat, rand } from "../core/utils";
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
        this._velocity = { x: 0, y: 0 };
        this._acceleration = { x: 0, y: 0 };
        this.drag = 0.8;
        this.speed = 0.35;
        this.maxSpeed = 0.6;
        this.isFiring = false;
        this.gremlinBlood = 0;
        this.currentRoom = null;
        this.health = 100;
        this.maxHealth = 100;
        this.completeAltars = [];
        this._rectangle = new _rectangle(this.x, this.y, this.width, this.height);
        this.bodyColor = 22;
        this.attackBoxColor = 8;
        this.attackDamage = 5;
        this.attackDuration = 4; // Number of frames the attack lasts
        this.attackCoolDown = 40; // Number of frames before the player can attack again
        this.attackDurationCounter = 0; // Counter for the attack duration
        this.attackCoolDownCounter = 0; // Counter for the cooldown

        this.dashSpeed = 12.0; // Speed during the dash
        this.dashDuration = 8; // Duration of the dash in frames
        this.dashCoolDown = 30; // Cooldown period after a dash
        this.isDashing = false; // Is the player currently dashing?
        this.dashCounter = 0; // Counter for dash duration
        this.dashCoolDownCounter = 0; // Counter for dash cooldown
        
        

        this.direction = 'down'; // Track the direction the player is facing
        this.directionAngles = {
            up: -Math.PI / 2,
            down: Math.PI / 2,
            left: Math.PI,
            right: 0
        }
        this.attackBox = new _rectangle(this.x, this.y, 0, 0);; // Placeholder for the attack box

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

        if (this.isDashing) {
            this.dashCounter--;

            // Move player in the direction of dash
            switch (this.direction) {
                case 'up':
                    this.y -= this.dashSpeed;
                    break;
                case 'down':
                    this.y += this.dashSpeed;
                    break;
                case 'left':
                    this.x -= this.dashSpeed;
                    break;
                case 'right':
                    this.x += this.dashSpeed;
                    break;
            }

            if (this.dashCounter <= 0) {
                this.isDashing = false;
                this.dashCoolDownCounter = this.dashCoolDown; // Start cooldown counter
            }
        } else {
            if (this.dashCoolDownCounter > 0) {
                this.dashCoolDownCounter--;
            }

        this._velocity.x += this._acceleration.x;
        this._velocity.x *= this.drag;
        this.x += this._velocity.x;
        if (tileCollisionCheck(map, this)) {
            this.x = this.oldX;
        }

        this._velocity.y += this._acceleration.y;
        this._velocity.y *= this.drag;
        this.y += this._velocity.y;
        if (tileCollisionCheck(map, this)) {
            this.y = this.oldY;
        }

        this.determineDirection();
    }

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
                let _particle = new Particle(
                    this.x + Math.cos(angle) * 20 + rand(-3, 3),
                    this.y + Math.sin(angle) * 20 + rand(-3, 3),
                    this._velocity.x + Math.cos(angle),
                    this._velocity.y + Math.sin(angle), 
                    {
                        _color: [22,21,20,19,18],
                        life: 15,
                        customUpdate: function(p) {
                            p.xVelocity += randFloat(-0.3, 0.3);
                            p.yVelocity += randFloat(-0.3, 0.3);
                        }
                    })
                _entitiesArray.push(_particle);
            }

        } else {
            this.attackBox.width = 0;
            this.attackBox.height = 0;
        }

        // Handle attack cooldown and duration
        if (this.attackCoolDownCounter > 0) {
            this.attackCoolDownCounter--;
        }

        if (this.attackDurationCounter > 0) {
            this.attackDurationCounter--;
            this.isFiring = true;
            this.updateAttackBox();
            // Add particle effects here if desired
        } else {
            this.isFiring = false;
            this.attackBox.width = 0;
            this.attackBox.height = 0;
        }

        this._acceleration.x = 0;
        this._acceleration.y = 0;

        // Only update the player's rectangle if not dashing
        if (!this.isDashing) {
            this._rectangle.x = this.x;
            this._rectangle.y = this.y;
        }
    }

    draw(r, view) {
        // Draw the legs
        this.legs.forEach(leg => leg.segments.forEach(segment => {
            r.line(segment.x - view.x, segment.y - view.y, segment.getEndX() - view.x, segment.getEndY() - view.y, this.bodyColor);
        }));

        // Draw body (with head and attack box)
        r._fRect(this.x - view.x, this.y - view.y-4, this.width, 8, this.bodyColor);

        //Draw attack box if firing
        // if (this.isFiring && this.attackBox) {
        //     r._fRect(this.attackBox.x - view.x, this.attackBox.y - view.y, this.attackBox.width, this.attackBox.height, this.attackBoxColor);
        // }
        
        lightRadial(this.x - view.x + 2, this.y - view.y + 2, 50, [0,1,2,3,4]);

        // //debug corners
        // r._fRect(this.x - view.x, this.y - view.y, 1, 1, 18);
        // r._fRect(this.x - view.x + this.width, this.y - view.y, 1, 1, 18);
        // r._fRect(this.x - view.x, this.y - view.y + this.height, 1, 1, 18);
        // r._fRect(this.x - view.x + this.width, this.y - view.y + this.height, 1, 1, 18);

        // //debug _rectangle
        // r._fRect(this._rectangle.x - view.x, this._rectangle.y - view.y, this._rectangle.width, this._rectangle.height, 10);
    }

    handleInput(Key) {
        if (Key.isDown(Key.LEFT) || Key.isDown(Key.a) || Key.isDown(Key.q)) {
            this._acceleration.x = -this.speed;
        } else if (Key.isDown(Key.RIGHT) || Key.isDown(Key.d)) {
            this._acceleration.x = this.speed;
        }
        if (Key.isDown(Key.UP) || Key.isDown(Key.w) || Key.isDown(Key.z)) {
            this._acceleration.y = -this.speed;
        } else if (Key.isDown(Key.DOWN) || Key.isDown(Key.s)) {
            this._acceleration.y = this.speed;
        }

        //dash input
        if (Key.isDown(Key.n) && !this.isDashing && this.dashCoolDownCounter === 0) {
            this.isDashing = true;
            this.dashCounter = this.dashDuration;
        }

        // Check if the attack button is pressed and if not on cooldown
        if (Key.isDown(Key.SPACE) || Key.isDown(Key.b) && this.attackCoolDownCounter === 0) {
            this.attackDurationCounter = this.attackDuration; // Reset attack duration counter
            this.attackCoolDownCounter = this.attackCoolDown; // Start cooldown counter
        }

        if(Key.justReleased(Key.SPACE) || Key.justReleased(Key.b)){
            this.attackCoolDownCounter = 0;
        }


        //debug keys
        if(Key.justReleased(Key.ONE)){
            this.health += 100;
            this.completeAltars = [6,7];
        }
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

    sumCompletedTorches() { return this.completeAltars.reduce((a, b) => a + b, 0); }


    updateAttackBox() {
        const attackSize = 8; // Adjust the size as needed
        switch (this.direction) {
            case 'up':
                this.attackBox.x = this.x - 16;
                this.attackBox.y = this.y - 8;
                this.attackBox.width = 32;
                this.attackBox.height = 32;
                break;
            case 'down':
                this.attackBox.x = this.x - 16;
                this.attackBox.y = this.y + this.height + 4;
                this.attackBox.width = 32;
                this.attackBox.height = 32;
                break;
            case 'left':
                this.attackBox.x = this.x - 32;
                this.attackBox.y = this.y - 18;
                this.attackBox.width = 32;
                this.attackBox.height = 32;
                break;
            case 'right':
                this.attackBox.x = this.x + 8;
                this.attackBox.y = this.y - 18;
                this.attackBox.width = 32;
                this.attackBox.height = 32;
                break;
        }
    }
    

    determineDirection() {
        if (this._velocity.x !== 0 || this._velocity.y !== 0) {
            const magnitude = Math.sqrt(this._velocity.x * this._velocity.x + this._velocity.y * this._velocity.y);
            const normalizedX = this._velocity.x / magnitude;
            const normalizedY = this._velocity.y / magnitude;

            if (Math.abs(normalizedX) > Math.abs(normalizedY)) {
                this.direction = normalizedX > 0 ? 'right' : 'left';
            } else {
                this.direction = normalizedY > 0 ? 'down' : 'up';
            }
        }
    }

}
