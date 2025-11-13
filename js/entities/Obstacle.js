import { Vector2D, Colors } from '../utils/math.js';

/**
 * Obstacle Entity
 * Provides cover in the level
 */
export class Obstacle {
    constructor(x, y, width, height) {
        this.position = new Vector2D(x, y);
        this.width = width;
        this.height = height;
        this.active = true;
    }

    render(renderer) {
        renderer.drawRect(
            this.position.x,
            this.position.y,
            this.width,
            this.height,
            Colors.WALL
        );
        
        // Add border for better visibility
        renderer.drawStrokeRect(
            this.position.x,
            this.position.y,
            this.width,
            this.height,
            '#3a3a5e',
            2
        );
    }

    getBounds() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height
        };
    }

    containsPoint(x, y) {
        return x >= this.position.x &&
               x <= this.position.x + this.width &&
               y >= this.position.y &&
               y <= this.position.y + this.height;
    }
}
