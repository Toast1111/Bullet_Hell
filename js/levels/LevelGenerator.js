import { Random } from '../utils/math.js';
import { Enemy, SpreadEnemy } from '../entities/Enemy.js';
import { CapturePoint } from '../entities/CapturePoint.js';

/**
 * Level Types
 */
export const LevelType = {
    ELIMINATION: 'elimination',
    CAPTURE_POINT: 'capture_point'
};

/**
 * Level Modifiers
 */
export const Modifiers = {
    FAST_ENEMIES: { name: 'Fast Enemies', speedMultiplier: 1.5 },
    MORE_ENEMIES: { name: 'More Enemies', enemyMultiplier: 1.5 },
    BULLET_HELL: { name: 'Bullet Hell', fireRateMultiplier: 2 },
    ELITE_ENEMIES: { name: 'Elite Enemies', healthMultiplier: 2 }
};

/**
 * Level Generator
 * Procedurally generates levels
 */
export class LevelGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    generateLevel(levelNumber, type, modifiers = []) {
        const level = {
            type,
            number: levelNumber,
            modifiers,
            enemies: [],
            capturePoint: null,
            objective: null
        };

        // Apply difficulty scaling
        const difficulty = 1 + (levelNumber - 1) * 0.3;

        if (type === LevelType.ELIMINATION) {
            level.objective = this._generateEliminationObjective(difficulty, modifiers);
            level.enemies = this._generateEnemies(level.objective.targetCount, modifiers, difficulty);
        } else if (type === LevelType.CAPTURE_POINT) {
            level.objective = this._generateCaptureObjective();
            level.capturePoint = new CapturePoint(
                this.width / 2,
                this.height / 2,
                3.0
            );
            const enemyCount = Math.floor(5 * difficulty);
            level.enemies = this._generateEnemies(enemyCount, modifiers, difficulty);
        }

        return level;
    }

    _generateEliminationObjective(difficulty, modifiers) {
        let targetCount = Math.floor(5 + difficulty * 3);
        
        if (modifiers.includes(Modifiers.MORE_ENEMIES)) {
            targetCount = Math.floor(targetCount * Modifiers.MORE_ENEMIES.enemyMultiplier);
        }

        return {
            type: 'elimination',
            targetCount,
            currentCount: 0,
            description: `Eliminate ${targetCount} enemies`
        };
    }

    _generateCaptureObjective() {
        return {
            type: 'capture_point',
            description: 'Capture the point'
        };
    }

    _generateEnemies(count, modifiers, difficulty) {
        const enemies = [];
        const margin = 50;

        for (let i = 0; i < count; i++) {
            let x, y;
            
            // Spawn away from center
            do {
                x = Random.range(margin, this.width - margin);
                y = Random.range(margin, this.height - margin);
            } while (
                Math.abs(x - this.width / 2) < 100 &&
                Math.abs(y - this.height / 2) < 100
            );

            // 20% chance for special enemy type
            const enemy = Random.boolean(0.2) 
                ? new SpreadEnemy(x, y)
                : new Enemy(x, y);

            // Apply modifiers
            this._applyModifiersToEnemy(enemy, modifiers, difficulty);
            
            enemies.push(enemy);
        }

        return enemies;
    }

    _applyModifiersToEnemy(enemy, modifiers, difficulty) {
        // Base difficulty scaling
        enemy.health *= difficulty;
        enemy.maxHealth = enemy.health;

        if (modifiers.includes(Modifiers.FAST_ENEMIES)) {
            enemy.speed *= Modifiers.FAST_ENEMIES.speedMultiplier;
        }

        if (modifiers.includes(Modifiers.BULLET_HELL)) {
            enemy.shootDelay /= Modifiers.BULLET_HELL.fireRateMultiplier;
        }

        if (modifiers.includes(Modifiers.ELITE_ENEMIES)) {
            enemy.health *= Modifiers.ELITE_ENEMIES.healthMultiplier;
            enemy.maxHealth = enemy.health;
        }
    }

    generateDoorOptions() {
        const types = [LevelType.ELIMINATION, LevelType.CAPTURE_POINT];
        const doors = [];

        for (let i = 0; i < 3; i++) {
            const type = Random.choice(types);
            const modifierList = Object.values(Modifiers);
            
            // Randomly select 0-2 modifiers
            const modifierCount = Random.int(0, 2);
            const selectedModifiers = [];
            
            for (let j = 0; j < modifierCount; j++) {
                const modifier = Random.choice(modifierList);
                if (!selectedModifiers.includes(modifier)) {
                    selectedModifiers.push(modifier);
                }
            }

            doors.push({
                type,
                modifiers: selectedModifiers
            });
        }

        return doors;
    }
}
