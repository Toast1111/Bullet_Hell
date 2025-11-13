import { Vector2D, Colors } from '../utils/math.js';

/**
 * Portal Entity
 * Represents a portal to the next level
 */
export class Portal {
    constructor(x, y, direction, doorData) {
        this.position = new Vector2D(x, y);
        this.direction = direction; // 'north', 'east', 'west'
        this.doorData = doorData; // Contains type and modifiers
        this.radius = 30;
        this.interactRadius = 40;
        this.active = true;
        this.animationTime = 0;
    }

    update(deltaTime) {
        this.animationTime += deltaTime;
    }

    canInteract(player) {
        const distance = this.position.distance(player.position);
        return distance < this.interactRadius;
    }

    render(renderer) {
        // Animated portal effect
        const pulseScale = 1 + Math.sin(this.animationTime * 3) * 0.1;
        const radius = this.radius * pulseScale;

        // Outer glow
        renderer.drawCircle(
            this.position.x,
            this.position.y,
            radius * 1.5,
            'rgba(0, 212, 255, 0.2)'
        );

        // Main portal ring
        renderer.ctx.strokeStyle = '#00d4ff';
        renderer.ctx.lineWidth = 4;
        renderer.ctx.beginPath();
        renderer.ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2);
        renderer.ctx.stroke();

        // Inner portal
        renderer.drawCircle(
            this.position.x,
            this.position.y,
            radius * 0.7,
            'rgba(0, 100, 200, 0.4)'
        );

        // Swirl effect
        const swirls = 6;
        for (let i = 0; i < swirls; i++) {
            const angle = (this.animationTime * 2 + (Math.PI * 2 / swirls) * i) % (Math.PI * 2);
            const x = this.position.x + Math.cos(angle) * radius * 0.5;
            const y = this.position.y + Math.sin(angle) * radius * 0.5;
            renderer.drawCircle(x, y, 3, 'rgba(0, 255, 255, 0.6)');
        }

        // Direction indicator
        renderer.drawText(
            this.direction.toUpperCase(),
            this.position.x,
            this.position.y - radius - 15,
            '#00ffff',
            12,
            'center'
        );

        // Show level type
        const typeName = this.doorData.type === 'elimination' ? 'ELIMINATION' : 'CAPTURE';
        renderer.drawText(
            typeName,
            this.position.x,
            this.position.y + radius + 20,
            '#ffcc00',
            10,
            'center'
        );
    }
}
