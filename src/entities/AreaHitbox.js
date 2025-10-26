// src/entities/AreaHitbox.js
import { Position, Collision, Lifetime, AreaDamage, Sprite } from '../core/components.js';

export class AreaHitboxFactory {
    
    static texture = null; // 靜態紋理

    /**
     * 創建 AOE 實體並附加所有 *永久* 元件
     */
    static create(app, entityManager) {
        const entityId = entityManager.createEntity();

        // ▼▼▼ 修正點 ▼▼▼
        if (!this.texture) {
            // 1. 定義一個基礎大小來繪製紋理
            const baseRadius = 50; // 基礎半徑 50px
            const baseSize = baseRadius * 2; // 基礎紋理尺寸 100x100
            
            const graphics = new PIXI.Graphics();
            graphics.beginFill(0xffffff, 0.3); // 白色, 30% 透明度
            
            // 2. 在 (50, 50) 繪製圓形，使其位於 100x100 紋理的正中心
            graphics.drawCircle(baseRadius, baseRadius, baseRadius); 
            graphics.endFill();
            
            // 3. 創建與繪製大小相符的紋理
            this.texture = PIXI.RenderTexture.create({ width: baseSize, height: baseSize }); 
            app.renderer.render(graphics, { renderTexture: this.texture });
        }
        // ▲▲▲ 修正完畢 ▲▲▲

        entityManager.addComponent(entityId, Position, new Position(0, 0));
        entityManager.addComponent(entityId, AreaDamage, new AreaDamage(0));
        // 使用基礎尺寸 100x100，Game.js 會在 spawn 時將其縮放到正確的武器半徑
        entityManager.addComponent(entityId, Sprite, new Sprite(this.texture, 100, 100));
        
        return entityId;
    }
}