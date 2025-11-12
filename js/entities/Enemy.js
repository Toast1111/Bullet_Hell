import { Entity } from './Entity.js';
import { Vector2D, Colors, Random } from '../utils/math.js';

/**
 * Base Enemy Class
 */
export class Enemy extends Entity {
    constructor(x, y, type = 'basic') {
        super(x, y);
        this.type = type;
        this.radius = 12;
        this.health = 30;
        this.maxHealth = 30;
        this.speed = 60;
        this.shootCooldown = 0;
        this.shootDelay = 1.5;
        this.damage = 10;
    }

    update(deltaTime, player, bullets, allEnemies = []) {
        // Movement toward player with separation from other enemies
        const toPlayer = player.position.subtract(this.position).normalize();
        
        // Add separation force to avoid clustering
        let separation = new Vector2D(0, 0);
        const separationRadius = 80; // Distance to maintain from other enemies
        const separationStrength = 2.0; // How strong the separation force is
        
        for (const other of allEnemies) {
            if (other === this || !other.active) continue;
            
            const distance = this.position.distance(other.position);
            if (distance < separationRadius && distance > 0) {
                const away = this.position.subtract(other.position);
                const force = away.normalize().multiply((separationRadius - distance) / separationRadius);
                separation = separation.add(force);
            }
        }
        
        // Combine player-seeking and separation
        const combined = toPlayer.add(separation.multiply(separationStrength)).normalize();
        this.velocity = combined.multiply(this.speed);
        
        super.update(deltaTime);

        // Shooting
        this.shootCooldown -= deltaTime;
        if (this.shootCooldown <= 0) {
            this.shoot(player, bullets);
            this.shootCooldown = this.shootDelay;
        }
    }

    shoot(player, bullets) {
        const direction = player.position.subtract(this.position).normalize();
        bullets.push(new EnemyBullet(this.position.x, this.position.y, direction));
    }

    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }

    render(renderer) {
        renderer.drawCircle(this.position.x, this.position.y, this.radius, Colors.ENEMY);
        
        // Health bar
        const barWidth = 30;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;
        
        renderer.drawRect(
            this.position.x - barWidth / 2,
            this.position.y - this.radius - 10,
            barWidth,
            barHeight,
            'rgba(0, 0, 0, 0.5)'
        );
        
        renderer.drawRect(
            this.position.x - barWidth / 2,
            this.position.y - this.radius - 10,
            barWidth * healthPercent,
            barHeight,
            '#00ff00'
        );
    }
}

/**
 * Spreader Enemy - Shoots in multiple directions
 */
export class SpreadEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'spread');
        this.health = 40;
        this.maxHealth = 40;
        this.shootDelay = 2.0;
        this.radius = 14;
    }

    shoot(player, bullets) {
        const directions = 8;
        for (let i = 0; i < directions; i++) {
            const angle = (Math.PI * 2 / directions) * i;
            const direction = Vector2D.fromAngle(angle);
            bullets.push(new EnemyBullet(this.position.x, this.position.y, direction));
        }
    }

    render(renderer) {
        // Draw as square
        const size = this.radius * 1.5;
        renderer.drawRect(
            this.position.x - size / 2,
            this.position.y - size / 2,
            size,
            size,
            '#ff6b00'
        );
        
        // Health bar
        const barWidth = 30;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;
        
        renderer.drawRect(
            this.position.x - barWidth / 2,
            this.position.y - this.radius - 10,
            barWidth,
            barHeight,
            'rgba(0, 0, 0, 0.5)'
        );
        
        renderer.drawRect(
            this.position.x - barWidth / 2,
            this.position.y - this.radius - 10,
            barWidth * healthPercent,
            barHeight,
            '#00ff00'
        );
    }
}

/**
 * Enemy Bullet
 */
export class EnemyBullet extends Entity {
    constructor(x, y, direction) {
        super(x, y);
        this.radius = 4;
        this.velocity = direction.multiply(250);
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
        renderer.drawCircle(this.position.x, this.position.y, this.radius, Colors.BULLET_ENEMY);
    }
}
