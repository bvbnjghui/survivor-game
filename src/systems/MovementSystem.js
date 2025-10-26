// src/systems/MovementSystem.js
// ▼▼▼ 1. 匯入 PlayerInput 和 Collision ▼▼▼
import { Position, Velocity, PlayerInput, Collision } from '../core/components.js';

export class MovementSystem {
    constructor(entityManager, worldWidth, worldHeight) {
        this.entityManager = entityManager;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
    }

    update(delta) {
        const entities = this.entityManager.getEntitiesWithComponents(Position, Velocity);

        for (const entityId of entities) {
            const position = this.entityManager.getComponent(entityId, Position);
            const velocity = this.entityManager.getComponent(entityId, Velocity);

            // 更新位置：位置 += 速度 * deltaTime
            position.x += velocity.vx * delta;
            position.y += velocity.vy * delta;

            // ▼▼▼ 3. 檢查是否為玩家並限制邊界 ▼▼▼
            if (this.entityManager.hasComponent(entityId, PlayerInput)) {
                // 獲取玩家的碰撞半徑
                const collision = this.entityManager.getComponent(entityId, Collision);
                const radius = collision ? collision.radius : 0;

                // Math.max 確保不會小於左/上邊界
                // Math.min 確保不會大於右/下邊界
                position.x = Math.max(radius, Math.min(position.x, this.worldWidth - radius));
                position.y = Math.max(radius, Math.min(position.y, this.worldHeight - radius));
            }
        }
    }

    updateBounds(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
    }
}