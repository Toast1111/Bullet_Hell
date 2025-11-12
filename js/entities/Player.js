import { Entity } from './Entity.js';
import { Vector2D, Colors } from '../utils/math.js';

/**
 * Player Entity
 * Player-controlled character
 */
export class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        this.radius = 8;
        this.speed = 200;
        this.health = 100;
        this.maxHealth = 100;
        this.shootCooldown = 0;
        this.shootDelay = 0.15; // seconds
    }

    move(direction) {
        this.velocity = direction.normalize().multiply(this.speed);
    }

    stop() {
        this.velocity = new Vector2D(0, 0);
    }

    shoot(targetPos, bullets) {
        if (this.shootCooldown > 0) return false;

        const direction = targetPos.subtract(this.position).normalize();
        const bullet = new PlayerBullet(
            this.position.x,
            this.position.y,
            direction
        );
        bullets.push(bullet);
        this.shootCooldown = this.shootDelay;
        return true;
    }

    update(deltaTime, bounds) {
        super.update(deltaTime);

        // Clamp to bounds
        this.position.x = Math.max(this.radius, Math.min(bounds.width - this.radius, this.position.x));
        this.position.y = Math.max(this.radius, Math.min(bounds.height - this.radius, this.position.y));

        // Update cooldowns
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    render(renderer) {
        // Draw player
        renderer.drawCircle(this.position.x, this.position.y, this.radius, Colors.PLAYER);
        
        // Draw inner circle
        renderer.drawCircle(this.position.x, this.position.y, this.radius * 0.5, '#fff');
    }
}

/**
 * Player Bullet
 */
export class PlayerBullet extends Entity {
    constructor(x, y, direction) {
        super(x, y);
        this.radius = 3;
        this.velocity = direction.multiply(400);
        this.damage = 10;
    }

    update(deltaTime, bounds) {
        super.update(deltaTime);

        // Deactivate if out of bounds
        if (this.position.x < 0 || this.position.x > bounds.width ||
            this.position.y < 0 || this.position.y > bounds.height) {
            this.active = false;
        }
    }

    render(renderer) {
        renderer.drawCircle(this.position.x, this.position.y, this.radius, Colors.BULLET_PLAYER);
    }
}
