import { Vector2D } from '../utils/math.js';

/**
 * Base Entity Class
 * All game objects inherit from this
 */
export class Entity {
    constructor(x, y) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(0, 0);
        this.radius = 10;
        this.active = true;
    }

    update(deltaTime) {
        this.position = this.position.add(this.velocity.multiply(deltaTime));
    }

    render(renderer) {
        // Override in subclasses
    }

    isCollidingWith(other) {
        return this.position.distance(other.position) < this.radius + other.radius;
    }
}
