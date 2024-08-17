import { tileCollisionCheck } from "../core/utils";
import Arm from "./arm"; // Assuming you have the correct path to arm.js

export default class Player {

    constructor(x, y) {
        this.width = 4;
        this.height = 4; // Height increased to account for legs
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

        this.direction = 'down'; // Track the direction the player is facing
        this.attackBox = null; // Placeholder for the attack box

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

        this.legTargets = [{ x: this.x - 2, y: this.y + 8 + 6 }, { x: this.x + 2, y: this.y + 8 + 6 }];
        this.stepDistance = 15; // Minimum distance before a leg takes a step
        this.legStepOffset = 120; // Offset in frames for alternating leg movement
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

        // Update direction based on movement
        if (this.velocity.x < 0) this.direction = 'left';
        else if (this.velocity.x > 0) this.direction = 'right';
        if (this.velocity.y < 0) this.direction = 'up';
        else if (this.velocity.y > 0) this.direction = 'down';

        // Update leg positions
        this.updateLegTargets();
        this.stepFrameCount++;

        // Update the legs
        this.legs.forEach((leg, index) => {
            leg.x = this.x + (index === 0 ? -2 : 2); // Attach legs to the sides of the player
            leg.y = this.y + this.height; // Attach legs to the bottom of the player
            leg.target = this.legTargets[index]; // Update target

            // Update leg if the step frame count is appropriate
            if (this.stepFrameCount > this.legStepOffset * index) {
                leg.update();
            }
        });

        // Update attack box if firing
        if (this.isFiring) {
            this.updateAttackBox();
        } else {
            this.attackBox = null; // Clear the attack box when not firing
        }

        this.acceleration.x = 0;
        this.acceleration.y = 0;
    }

    draw(r, view) {
        // Draw the legs
        this.legs.forEach(leg => leg.segments.forEach(segment => {
            r.line(segment.x - view.x, segment.y - view.y, segment.getEndX() - view.x, segment.getEndY() - view.y, 20);
        }));

        // Draw body (with head and attack box)
        r.fRect(this.x - view.x, this.y - view.y-4, this.width, 8, 22);

        // Draw attack box if firing
        if (this.isFiring && this.attackBox) {
            r.fRect(this.attackBox.x - view.x, this.attackBox.y - view.y, this.attackBox.width, this.attackBox.height, 23);
        }

        // Display health and other stats above the player
        r.text(`${this.health.toFixed(2)}\nGB: ${this.gremlinBlood}\nAP: ${this.completeAltarTorchCount}`, this.x - view.x, this.y - view.y - 28, 1, 1, 'center', 'top', 1, 22);
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
        const offset = 10; // Distance ahead of the player for the leg targets
        let targetX, targetY;

        switch (this.direction) {
            case 'up':
                targetX = this.x;
                targetY = this.y + this.height + offset-3;
                break;
            case 'down':
                targetX = this.x;
                targetY = this.y + this.height + offset;
                break;
            case 'left':
                targetX = this.x - offset;
                targetY = this.y + this.height + offset
                break;
            case 'right':
                targetX = this.x + offset;
                targetY = this.y + this.height + offset + 10;
                break;
        }

        // Update the targets for each leg only if the player has moved sufficiently
        this.legs.forEach((leg, index) => {
            const legTarget = this.legTargets[index];
            const distance = Math.hypot(targetX - legTarget.x, targetY - legTarget.y);
            if (distance > this.stepDistance) {
                this.legTargets[index] = { x: targetX + (index === 0 ? -2 : 2), y: targetY };
            }
        });
    }

    updateAttackBox() {
        const attackSize = 8;
        switch (this.direction) {
            case 'up':
                this.attackBox = { x: this.x, y: this.y - attackSize, width: this.width, height: attackSize };
                break;
            case 'down':
                this.attackBox = { x: this.x, y: this.y + this.height, width: this.width, height: attackSize };
                break;
            case 'left':
                this.attackBox = { x: this.x - attackSize, y: this.y, width: attackSize, height: this.height };
                break;
            case 'right':
                this.attackBox = { x: this.x + this.width, y: this.y, width: attackSize, height: this.height };
                break;
        }
    }
}
