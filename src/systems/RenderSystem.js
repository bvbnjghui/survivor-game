// src/systems/RenderSystem.js
import { Position, Sprite } from '../core/components.js';

export class RenderSystem {
    constructor(entityManager, worldContainer) {
        this.entityManager = entityManager;
        this.worldContainer = worldContainer;
        this.spriteMap = new Map(); // entityId -> PIXI.Sprite
    }

    update(delta) {
        const renderableEntities = this.entityManager.getEntitiesWithComponents(Position, Sprite);

        // 創建或更新 sprites
        for (const entityId of renderableEntities) {
            const position = this.entityManager.getComponent(entityId, Position);
            const spriteComponent = this.entityManager.getComponent(entityId, Sprite);

            let sprite = this.spriteMap.get(entityId);
            if (!sprite) {
                // 創建新的 sprite
                sprite = new PIXI.Sprite(spriteComponent.texture);
                sprite.width = spriteComponent.width;
                sprite.height = spriteComponent.height;
                sprite.anchor.set(0.5); // 中心點
                this.worldContainer.addChild(sprite);
                this.spriteMap.set(entityId, sprite);
                spriteComponent.sprite = sprite;
            }

            // 更新位置
            sprite.x = position.x;
            sprite.y = position.y;
        }

        // 移除不存在實體的 sprites
        for (const [entityId, sprite] of this.spriteMap) {
            if (!this.entityManager.getComponent(entityId, Sprite)) {
                this.worldContainer.removeChild(sprite);
                this.spriteMap.delete(entityId);
            }
        }
    }
}