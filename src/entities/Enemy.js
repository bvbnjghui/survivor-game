// src/entities/Enemy.js
// ▼▼▼ 1. 匯入 EnemyType 和 getEnemyTexture ▼▼▼
import { Position, Velocity, Health, Sprite, Collision, EnemyAI, EnemyType } from '../core/components.js';
import { getEnemyTexture } from '../data/enemyTypes.js';

export class Enemy {
    // ▼▼▼ 2. 修改 create 函式的參數 ▼▼▼
    static create(app, entityManager, typeKey, typeData, targetEntityId) {
        const entityId = entityManager.createEntity();

        // ▼▼▼ 3. 使用 getEnemyTexture 和 typeData 創建 Sprite ▼▼▼
        const texture = getEnemyTexture(app, typeData);

        // ▼▼▼ 4. 使用 typeData 設定元件 ▼▼▼
        entityManager.addComponent(entityId, Position, new Position(0, 0)); // (spawn時設定)
        entityManager.addComponent(entityId, Velocity, new Velocity(0, 0));
        entityManager.addComponent(entityId, Health, new Health(typeData.health, typeData.health));
        entityManager.addComponent(entityId, Sprite, new Sprite(texture, typeData.width, typeData.height));
        entityManager.addComponent(entityId, Collision, new Collision(typeData.radius));
        entityManager.addComponent(entityId, EnemyAI, new EnemyAI(targetEntityId));
        
        // ▼▼▼ 5. (關鍵) 加入 EnemyType 元件 ▼▼▼
        entityManager.addComponent(entityId, EnemyType, new EnemyType(typeKey));

        return entityId;
    }
}