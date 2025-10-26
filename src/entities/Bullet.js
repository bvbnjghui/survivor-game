// src/entities/Bullet.js
import { Position, Velocity, Sprite, Collision, Bullet, Lifetime } from '../core/components.js';

export class BulletFactory {
    
    static texture = null; // 靜態紋理，避免重複創建

    /**
     * 創建子彈實體並附加所有 *永久* 元件
     */
    static create(app, entityManager, damage) {
        // 如果還沒有紋理，創建一個
        if (!this.texture) {
            const graphics = new PIXI.Graphics();
            graphics.beginFill(0xffff00); // 黃色
            graphics.drawRect(0, 0, 8, 8);
            graphics.endFill();
            this.texture = PIXI.RenderTexture.create({ width: 8, height: 8 });
            app.renderer.render(graphics, { renderTexture: this.texture });
        }

        const entityId = entityManager.createEntity();
        entityManager.addComponent(entityId, Position, new Position(0, 0));
        entityManager.addComponent(entityId, Sprite, new Sprite(this.texture, 8, 8));
        entityManager.addComponent(entityId, Bullet, new Bullet(damage));

        // 注意：Velocity, Collision, Lifetime 是 *暫時* 元件
        // 它們會在 spawn (reset) 時被添加

        return entityId;
    }
}