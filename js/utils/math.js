/**
 * Vector2D Utility Class
 * Provides 2D vector math operations
 */
export class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector2D(this.x + v.x, this.y + v.y);
    }

    subtract(v) {
        return new Vector2D(this.x - v.x, this.y - v.y);
    }

    multiply(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    divide(scalar) {
        return new Vector2D(this.x / scalar, this.y / scalar);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2D(0, 0);
        return this.divide(mag);
    }

    distance(v) {
        return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    static fromAngle(angle, magnitude = 1) {
        return new Vector2D(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
    }

    clone() {
        return new Vector2D(this.x, this.y);
    }
}

/**
 * Random Utility Functions
 */
export const Random = {
    range(min, max) {
        return Math.random() * (max - min) + min;
    },

    int(min, max) {
        return Math.floor(this.range(min, max + 1));
    },

    choice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    boolean(probability = 0.5) {
        return Math.random() < probability;
    }
};

/**
 * Color Utilities
 */
export const Colors = {
    PLAYER: '#00d4ff',
    ENEMY: '#ff0050',
    BULLET_PLAYER: '#00ffff',
    BULLET_ENEMY: '#ff6b6b',
    CAPTURE_POINT: '#ffcc00',
    WALL: '#2a2a4e'
};
