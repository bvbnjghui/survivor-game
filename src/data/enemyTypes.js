// src/data/enemyTypes.js
// 遵循 CONTRIBUTING.md 的 "Content is Data-Driven" 原則

// --------------------------------------------------
// 紋理快取 (Texture Cache)
// --------------------------------------------------
// 為了效能，我們在這裡快取生成的紋理
// 避免在 Enemy.js 中重複創建
const textures = new Map();

/**
 * 根據敵人資料獲取或創建 PIXI 紋理
 * @param {PIXI.Application} app - Pixi App
 * @param {object} typeData - 來自 ENEMY_TYPES 的單個敵人資料
 * @returns {PIXI.Texture}
 */
function getEnemyTexture(app, typeData) {
    const key = typeData.color; // 用顏色當作 Key
    if (textures.has(key)) {
        return textures.get(key);
    }

    // 如果快取中沒有，創建一個新的
    const graphics = new PIXI.Graphics();
    graphics.beginFill(typeData.color);
    graphics.drawRect(0, 0, typeData.width, typeData.height);
    graphics.endFill();
    
    const texture = PIXI.RenderTexture.create({ 
        width: typeData.width, 
        height: typeData.height 
    });
    app.renderer.render(graphics, { renderTexture: texture });
    
    textures.set(key, texture);
    return texture;
}

// --------------------------------------------------
// 敵人資料定義
// --------------------------------------------------
export const ENEMY_TYPES = {
    'bat': {
        name: 'Bat',
        assetPath: 'assets/sprites/bat.png',
        health: 50,      // 血量
        speed: 100,      // 移動速度 (pixels/sec)
        color: 0xff0000, // 紅色 (目前敵人)
        width: 24,
        height: 24,
        radius: 12,      // 碰撞半徑
        xp: 10,          // 擊殺經驗
        score: 50,       // 擊殺分數
    },
    'goblin': {
        name: 'Goblin',
        assetPath: 'assets/sprites/goblin.png',
        health: 100,     // 血量較多
        speed: 75,       // 速度較慢
        color: 0x008000, // 綠色
        width: 28,
        height: 28,
        radius: 14,      // 體型稍大
        xp: 25,
        score: 100,
    }
};

// 導出 getTexture 函式，供 Enemy.js 使用
export { getEnemyTexture };