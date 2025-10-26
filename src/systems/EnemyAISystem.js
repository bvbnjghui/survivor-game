// src/systems/EnemyAISystem.js
// ▼▼▼ 1. 匯入 EnemyType 和 ENEMY_TYPES ▼▼▼
import { EnemyAI, Velocity, Position, EnemyType } from '../core/components.js';
import { ENEMY_TYPES } from '../data/enemyTypes.js';

export class EnemyAISystem {
    constructor(entityManager) {
        this.entityManager = entityManager;
    }

    update(delta) {
        // ▼▼▼ 2. 查詢時加入 EnemyType ▼▼▼
        const enemies = this.entityManager.getEntitiesWithComponents(EnemyAI, Velocity, Position, EnemyType);

        for (const entityId of enemies) {
            const ai = this.entityManager.getComponent(entityId, EnemyAI);
            const velocity = this.entityManager.getComponent(entityId, Velocity);
            const position = this.entityManager.getComponent(entityId, Position);
            // ▼▼▼ 3. 獲取類型元件和資料 ▼▼▼
            const typeComp = this.entityManager.getComponent(entityId, EnemyType);
            const typeData = typeComp ? ENEMY_TYPES[typeComp.type] : null;

            if (ai.targetEntityId !== null) {
                const targetPosition = this.entityManager.getComponent(ai.targetEntityId, Position);
                if (targetPosition) {
                    // 簡單的追逐邏輯
                    const dx = targetPosition.x - position.x;
                    const dy = targetPosition.y - position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance > 0) {
                        // ▼▼▼ 4. (修改) 使用資料中的 speed ▼▼▼
                        const speed = typeData ? typeData.speed : 100; // (如果找不到資料，預設 100)
                        velocity.vx = (dx / distance) * speed;
                        velocity.vy = (dy / distance) * speed;
                    } else {
                        // 避免除以零
                        velocity.vx = 0;
                        velocity.vy = 0;
                    }
                }
            }
        }
    }
}