
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
        };
        this.target = {
            type: this.targetTypes.PLAYER,
            x: player.x,
            y: player.y
        };
    }

    draw(r, view) {
        if (!this.alive) return;
        
        r.fRect(this.x - view.x, this.y - view.y - 8, 8, 10, 16, 16);
        lightRadial(this.x - view.x, this.y - view.y, 30, [2, 4]);

        const hornColor = this.isAttacking ? 6 : 16;
        r.fRect(this.x - view.x - 2, this.y - view.y - 10, 2, 4, hornColor);
        r.fRect(this.x - view.x + 4, this.y - view.y - 10, 2, 4, hornColor);

        r.text(`${this.health}`, this.x - view.x, this.y - view.y - 16, 1, 1, 'center', 'top', 1, 22);
    }

    update() {
        if (!this.alive) return;

        if (this.health <= 0) {
            this.die();
        }

        const now = Date.now();

        if (this.isAttacking) {
            if (now - this.telegraphStartTime >= this.attackTelegraphTime) {
                this.performAttack();
            }
            return;
        }

        this.oldX = this.x;
        this.oldY = this.y;

        // Check for collision with player's attack box and apply damage
        this.checkPlayerAttack();

        // Seek out the target (player or lit torch)
        this.seekTarget();

        // Initiate attack telegraph if within range and cooldown passed
        const distanceToTarget = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (distanceToTarget <= this.attackRange && now - this.lastAttackTime >= this.attackCooldown) {
            this.startAttackTelegraph();
        } else {
            this.randomWander();
        }

        this.applyMovement();
    }

    checkPlayerAttack() {
        if (player.isFiring && this.rectangle.intersects(player.attackBox)) {
            this.health -= player.attackDamage; // Assuming player has an attackDamage property
            //playSound('hit'); // Assuming there's a sound effect for hitting
        }
    }

    seekTarget() {
        if (this.target.type === this.targetTypes.PLAYER) {
            this.target.x = player.x;
            this.target.y = player.y;
        }
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
        this.isAttacking = true;
        this.telegraphStartTime = Date.now();
        this.acceleration.x = 0;
        this.acceleration.y = 0;
    }

    performAttack() {
        this.isAttacking = false;
        this.lastAttackTime = Date.now();
        // Perform attack logic (e.g., reducing player's health)
        if (this.target.type === this.targetTypes.PLAYER) {
            if (Math.hypot(player.x - this.x, player.y - this.y) <= this.attackRange) {
                player.health -= this.damage; // Assuming player has a health property
            }
        }
    }

    applyMovement() {
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;

        this.velocity.x *= this.drag;
        this.velocity.y *= this.drag;

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        this.rectangle.x = this.x;
        this.rectangle.y = this.y;
    }

    die() {
        this.alive = false;
        // Additional death logic (e.g., spawning particles)
    }
}
