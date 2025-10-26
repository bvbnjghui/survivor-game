// src/entities/Player.js
import { 
    Position, Velocity, Health, Sprite, Collision, 
    PlayerInput, Experience, ActiveWeapons,
    PlayerStats
} from '../core/components.js';

export class Player {
    static create(app, entityManager, x = 400, y = 300) {
        const entityId = entityManager.createEntity();

        // 創建一個簡單的彩色矩形作為玩家 sprite
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0x00ff00); // 綠色
        graphics.drawRect(0, 0, 32, 32);
        graphics.endFill();
        const texture = PIXI.RenderTexture.create({ width: 32, height: 32 });
        app.renderer.render(graphics, { renderTexture: texture });

        entityManager.addComponent(entityId, Position, new Position(x, y));
        entityManager.addComponent(entityId, Velocity, new Velocity(0, 0));
        entityManager.addComponent(entityId, Health, new Health(100, 100));
        entityManager.addComponent(entityId, Sprite, new Sprite(texture, 32, 32));
        entityManager.addComponent(entityId, Collision, new Collision(16));
        entityManager.addComponent(entityId, PlayerInput, new PlayerInput());
        entityManager.addComponent(entityId, Experience, new Experience());

        entityManager.addComponent(entityId, PlayerStats, new PlayerStats());

        // 新: 添加 ActiveWeapons 並裝備 'wand' 和 'aura'
        const activeWeapons = new ActiveWeapons();
        activeWeapons.weapons.push({ id: 'wand', level: 1, lastFired: 0 });
        activeWeapons.weapons.push({ id: 'aura', level: 1, lastFired: 0 });
        entityManager.addComponent(entityId, ActiveWeapons, activeWeapons);

        return entityId;
    }
}