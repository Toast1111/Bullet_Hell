import { Vector2D, Colors, Random } from '../utils/math.js';

/**
 * Capture Point Entity
 * Objective for capture the point levels
 */
export class CapturePoint {
    constructor(x, y, captureTime = 3.0) {
        this.position = new Vector2D(x, y);
        this.radius = 40;
        this.captureRadius = 50;
        this.captureTime = captureTime;
        this.currentCapture = 0;
        this.captured = false;
    }

    update(deltaTime, player) {
        const distance = this.position.distance(player.position);
        
        if (distance < this.captureRadius) {
            this.currentCapture += deltaTime;
            if (this.currentCapture >= this.captureTime) {
                this.captured = true;
            }
        } else {
            // Slowly lose capture progress
            this.currentCapture = Math.max(0, this.currentCapture - deltaTime * 0.5);
        }
    }

    isCaptured() {
        return this.captured;
    }

    getProgress() {
        return this.currentCapture / this.captureTime;
    }

    render(renderer) {
        // Outer ring
        renderer.drawCircle(this.position.x, this.position.y, this.captureRadius, 'rgba(255, 204, 0, 0.1)');
        renderer.ctx.strokeStyle = Colors.CAPTURE_POINT;
        renderer.ctx.lineWidth = 3;
        renderer.ctx.beginPath();
        renderer.ctx.arc(this.position.x, this.position.y, this.captureRadius, 0, Math.PI * 2);
        renderer.ctx.stroke();

        // Inner circle with progress
        const progress = this.getProgress();
        renderer.drawCircle(this.position.x, this.position.y, this.radius, 'rgba(0, 0, 0, 0.5)');
        
        // Progress arc
        if (progress > 0) {
            renderer.ctx.beginPath();
            renderer.ctx.arc(
                this.position.x,
                this.position.y,
                this.radius,
                -Math.PI / 2,
                -Math.PI / 2 + Math.PI * 2 * progress
            );
            renderer.ctx.lineTo(this.position.x, this.position.y);
            renderer.ctx.closePath();
            renderer.ctx.fillStyle = this.captured ? '#00ff00' : Colors.CAPTURE_POINT;
            renderer.ctx.fill();
        }

        // Text
        const text = this.captured ? 'CAPTURED!' : `${Math.floor(progress * 100)}%`;
        renderer.drawText(text, this.position.x, this.position.y + 5, '#fff', 14, 'center');
    }
}
