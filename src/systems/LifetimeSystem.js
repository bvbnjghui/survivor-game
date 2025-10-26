// src/systems/LifetimeSystem.js
import { Lifetime, Bullet, AreaDamage } from '../core/components.js';

export class LifetimeSystem {
    constructor(entityManager, game) {
        this.entityManager = entityManager;
        this.game = game; // 用於呼叫 game.releaseBullet
    }

    update(delta) {
        const entities = this.entityManager.getEntitiesWithComponents(Lifetime);

        for (const entityId of entities) {
            const lifetime = this.entityManager.getComponent(entityId, Lifetime);
            lifetime.timer -= delta;

            if (lifetime.timer <= 0) {
                // ▼▼▼ 2. 檢查實體類型並歸還到 *正確的* 物件池 ▼▼▼
                if (this.entityManager.hasComponent(entityId, Bullet)) {
                    this.game.releaseBullet(entityId);
                } 
                else if (this.entityManager.hasComponent(entityId, AreaDamage)) {
                    this.game.releaseAreaHitbox(entityId); // <-- 新增
                }
            }
        }
    }
}