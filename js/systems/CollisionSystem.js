/**
 * Collision System
 * Handles collision detection and resolution
 */
export class CollisionSystem {
    checkCollisions(player, enemies, playerBullets, enemyBullets) {
        const results = {
            playerHit: false,
            enemiesHit: [],
            bulletsToRemove: {
                player: [],
                enemy: []
            }
        };

        // Player bullets vs Enemies
        for (const bullet of playerBullets) {
            if (!bullet.active) continue;

            for (const enemy of enemies) {
                if (!enemy.active) continue;

                if (bullet.isCollidingWith(enemy)) {
                    const dead = enemy.takeDamage(bullet.damage);
                    if (dead) {
                        enemy.active = false;
                        results.enemiesHit.push(enemy);
                    }
                    bullet.active = false;
                    results.bulletsToRemove.player.push(bullet);
                    break;
                }
            }
        }

        // Enemy bullets vs Player
        for (const bullet of enemyBullets) {
            if (!bullet.active) continue;

            if (bullet.isCollidingWith(player)) {
                player.takeDamage(bullet.damage);
                bullet.active = false;
                results.bulletsToRemove.enemy.push(bullet);
                results.playerHit = true;
            }
        }

        // Enemies vs Player (collision damage)
        for (const enemy of enemies) {
            if (!enemy.active) continue;

            if (enemy.isCollidingWith(player)) {
                player.takeDamage(enemy.damage * 0.1); // Less damage from collision
                results.playerHit = true;
            }
        }

        return results;
    }

    cleanupInactive(array) {
        return array.filter(item => item.active);
    }
}
