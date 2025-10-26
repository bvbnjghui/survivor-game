// src/entities/ExperienceOrb.js
import { Position, Sprite, Collision, ExperienceOrb } from '../core/components.js';

export class ExperienceOrbFactory {
    
    static texture = null; // 靜態紋理，避免重複創建

    /**
     * 創建經驗球實體並附加所有 *永久* 元件
     */
    static create(app, entityManager) {
        // 如果還沒有紋理，創建一個
        if (!this.texture) {
            const graphics = new PIXI.Graphics();
            graphics.beginFill(0x00ffff); // 青色
            graphics.drawCircle(0, 0, 5); // 半徑 5
            graphics.endFill();
            this.texture = PIXI.RenderTexture.create({ width: 10, height: 10 });
            app.renderer.render(graphics, { renderTexture: this.texture });
        }

        const entityId = entityManager.createEntity();
        entityManager.addComponent(entityId, Position, new Position(0, 0));
        entityManager.addComponent(entityId, Sprite, new Sprite(this.texture, 10, 10));
        entityManager.addComponent(entityId, ExperienceOrb, new ExperienceOrb(10)); // 預設 10 XP

        // 注意：Collision 是 *暫時* 元件，會在 spawn (reset) 時被添加

        return entityId;
    }
}