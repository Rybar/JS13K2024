import { tileCollisionCheck, rectangle, lightRadial, playSound, randFloat, rand } from "../core/utils";
import Arm from "./arm";
import Particle from "./particle";

export default class P {
    constructor(x, y) {
        Object.assign(this, {
            width: 4, height: 4, oldX: x, oldY: y, x, y, alive: true,
            velocity: { x: 0, y: 0 }, acceleration: { x: 0, y: 0 }, drag: 0.8,
            speed: 0.5, maxSpeed: 0.8, isFiring: false, gremlinBlood: 0,
            currentRoom: null, health: 100, maxHealth: 100, completeAltars: [],
            rectangle: new rectangle(x, y, 4, 4), bodyColor: 22, attackBoxColor: 8,
            attackDamage: 5, attackDuration: 4, attackCoolDown: 30, attackDurationCounter: 0,
            attackCoolDownCounter: 0, dashSpeed: 12.0, dashDuration: 8, dashCoolDown: 30,
            isDashing: false, dashCounter: 0, dashCoolDownCounter: 0, isInvincible: false,
            invincibilityDuration: 1000, invincibilityCounter: 0, direction: 'down',
            directionAngles: { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 },
            attackBox: new rectangle(x, y, 0, 0), legs: [new Arm(x, y + 4), new Arm(x, y + 4)],
            legTargets: [{ x, y: y + 8 }, { x, y }], stepFrameCount: 0, stepDistance: 16, legStepOffset: 8
        });

        this.legs.forEach(leg => { leg.addSegment(4); leg.addSegment(4); });
    }

    update() {
        if (this.health <= 0) { gameOver = true; playSound(sounds.playerDeath); }
        this.oldX = this.x; this.oldY = this.y;

        if (this.isInvincible) {
            this.health = this.maxHealth;
            if (++this.invincibilityCounter >= this.invincibilityDuration) {
                this.isInvincible = false; this.invincibilityCounter = 0;
            }
            entitiesArray.push(new Particle(this.x + rand(-4, 4), this.y, randFloat(-0.05, 0.05), -0.65, { color: [10, 11, 12, 13, 14, 15], life: 70 }));
        }

        if (this.isDashing) {
            this.dashCounter--;
            const dir = this.direction;
            this.y += dir === 'up' ? -this.dashSpeed : dir === 'down' ? this.dashSpeed : 0;
            this.x += dir === 'left' ? -this.dashSpeed : dir === 'right' ? this.dashSpeed : 0;
            if (this.dashCounter <= 0) { this.isDashing = false; this.dashCoolDownCounter = this.dashCoolDown; }
        } else {
            if (this.dashCoolDownCounter > 0) this.dashCoolDownCounter--;
            this.velocity.x += this.acceleration.x; this.velocity.x *= this.drag; this.x += this.velocity.x;
            if (tileCollisionCheck(map, this)) this.x = this.oldX;
            this.velocity.y += this.acceleration.y; this.velocity.y *= this.drag; this.y += this.velocity.y;
            if (tileCollisionCheck(map, this)) this.y = this.oldY;
            this.determineDirection();
        }

        this.updateLegTargets(); this.stepFrameCount++;
        this.legs.forEach((leg, i) => {
            leg.x = this.x + (i === 0 ? 0 : 3); leg.y = this.y + 4; leg.target = this.legTargets[i];
            if (this.stepFrameCount > this.legStepOffset * i) leg.update();
        });

        if (this.isFiring) {
            this.updateAttackBox();
            for (let i = 0; i < 40; i++) {
                let angle = this.directionAngles[this.direction] + Math.random() * Math.PI / 2 - Math.PI / 4;
                entitiesArray.push(new Particle(this.x + Math.cos(angle) * 20 + rand(-3, 3), this.y + Math.sin(angle) * 20 + rand(-3, 3), this.velocity.x + Math.cos(angle), this.velocity.y + Math.sin(angle), { color: [22, 21, 20, 19, 18], life: 5, customUpdate: p => { p.xVelocity += randFloat(-0.3, 0.3); p.yVelocity += randFloat(-0.3, 0.3); } }));
            }
        } else { this.attackBox.width = 0; this.attackBox.height = 0; }

        if (this.attackCoolDownCounter > 0) this.attackCoolDownCounter--;
        if (this.attackDurationCounter > 0) {
            if (this.attackDurationCounter === this.attackDuration) playSound(sounds.playerAttack, 1, 0, 0.1);
            this.attackDurationCounter--; this.isFiring = true; this.updateAttackBox();
        } else { this.isFiring = false; this.attackBox.width = 0; this.attackBox.height = 0; }

        this.acceleration.x = 0; this.acceleration.y = 0;
    }

    draw(r, view) {
        this.legs.forEach(leg => leg.segments.forEach(segment => r.line(segment.x - view.x, segment.y - view.y, segment.getEndX() - view.x, segment.getEndY() - view.y, this.bodyColor)));
        r.fRect(this.x - view.x, this.y - view.y - 4, this.width, 8, this.bodyColor);
        r.sspr(16, 0, 16, 16, this.x - 2 - view.x, this.y - view.y - 8, 8, 8, 0, 0);
        lightRadial(this.x - view.x + 2, this.y - view.y + 2, 50, [0, 1, 2, 3, 4]);
        if (this.sumCompletedTorches() >= 13) {
            let dx = portalLocation.x * tileSize - this.x, dy = portalLocation.y * tileSize - this.y, angle = Math.atan2(dy, dx);
            r.polygon(this.x + Math.cos(angle) * 20 - view.x, this.y + Math.sin(angle) * 20 - view.y, 5, 3, angle, 11, 11);
        }
    }

    handleInput(Key) {
        if (Key.isDown(Key.LEFT) || Key.isDown(Key.a) || Key.isDown(Key.q)) this.acceleration.x = -this.speed;
        else if (Key.isDown(Key.RIGHT) || Key.isDown(Key.d)) this.acceleration.x = this.speed;
        if (Key.isDown(Key.UP) || Key.isDown(Key.w) || Key.isDown(Key.z)) this.acceleration.y = -this.speed;
        else if (Key.isDown(Key.DOWN) || Key.isDown(Key.s)) this.acceleration.y = this.speed;
        if (Key.isDown(Key.n) && !this.isDashing && this.dashCoolDownCounter <= 0) { this.isDashing = true; this.dashCounter = this.dashDuration; }
        if ((Key.isDown(Key.SPACE) || Key.isDown(Key.b)) && this.attackCoolDownCounter <= 0) {
            this.attackDurationCounter = this.attackDuration; this.attackCoolDownCounter = this.attackCoolDown;
        }
    }

    handleGamepadInput(gamepad) {
        const deadzone = 0.2, x = gamepad.axes[0], y = gamepad.axes[1];
        if (Math.abs(x) > deadzone) this.acceleration.x = x * this.speed;
        if (Math.abs(y) > deadzone) this.acceleration.y = y * this.speed;
        if (gamepad.buttons[0].pressed && !this.isDashing && this.dashCoolDownCounter <= 0) { this.isDashing = true; this.dashCounter = this.dashDuration; }
        if (gamepad.buttons[1].pressed && this.attackCoolDownCounter <= 0) {
            this.attackDurationCounter = this.attackDuration; this.attackCoolDownCounter = this.attackCoolDown;
        }
    }

    handleClick(e) {
        if (this.attackCoolDownCounter <= 0) {
            this.attackDurationCounter = this.attackDuration; this.attackCoolDownCounter = this.attackCoolDown;
        }
    }

    updateLegTargets() {
        const offset = 6, verticalOffset = 6;
        let targetX, targetY;
        switch (this.direction) {
            case 'up': case 'down': targetX = this.x; targetY = this.y + 4 + verticalOffset; break;
            case 'left': targetX = this.x - offset; targetY = this.y + 4 + verticalOffset; break;
            case 'right': targetX = this.x + offset; targetY = this.y + 4 + verticalOffset; break;
        }
        this.legs.forEach((leg, i) => {
            const legTarget = this.legTargets[i], distance = Math.hypot(targetX - legTarget.x, targetY - legTarget.y);
            if (distance > this.stepDistance) {
                this.legTargets[i] = { x: targetX + (i === 0 ? 0 : 3), y: targetY };
                playSound(sounds.footstep, 1, 0, 0.1);
            }
        });
    }

    sumCompletedTorches() { return this.completeAltars.reduce((a, b) => a + b, 0); }

    updateAttackBox() {
        const attackSize = 8;
        switch (this.direction) {
            case 'up': this.attackBox.x = this.x - 16; this.attackBox.y = this.y - 8; break;
            case 'down': this.attackBox.x = this.x - 16; this.attackBox.y = this.y + 4; break;
            case 'left': this.attackBox.x = this.x - 32; this.attackBox.y = this.y - 18; break;
            case 'right': this.attackBox.x = this.x + 8; this.attackBox.y = this.y - 18; break;
        }
        this.attackBox.width = 32; this.attackBox.height = 32;
    }

    determineDirection() {
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            const magnitude = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
            const normalizedX = this.velocity.x / magnitude, normalizedY = this.velocity.y / magnitude;
            this.direction = Math.abs(normalizedX) > Math.abs(normalizedY) ? (normalizedX > 0 ? 'right' : 'left') : (normalizedY > 0 ? 'down' : 'up');
        }
    }
}