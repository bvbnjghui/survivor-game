// src/systems/EnemySpawnerSystem.js
// ▼▼▼ 1. 匯入敵人類型 ▼▼▼
import { ENEMY_TYPES } from '../data/enemyTypes.js';

export class EnemySpawnerSystem {
    constructor(game) {
        this.game = game;
        this.entityManager = game.entityManager;
        
        this.spawnTimer = 0;
        this.initialSpawnInterval = 3.0;
        this.minSpawnInterval = 0.5;
        this.rampUpTime = 60.0;

        // ▼▼▼ 2. 獲取可生成的敵人列表 ▼▼▼
        this.spawnableTypes = Object.keys(ENEMY_TYPES);
    }

    update(delta) {
        this.spawnTimer += delta;
        const progress = Math.min(1.0, this.game.gameTime / this.rampUpTime);
        const currentInterval = this.initialSpawnInterval - (this.initialSpawnInterval - this.minSpawnInterval) * progress;

        if (this.spawnTimer >= currentInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy(); // <-- 呼叫我們修改後的 spawnEnemy
        }
    }

    spawnEnemy() {
        // ... (計算 x, y 的邏輯保持不變) ...
        const { width, height } = this.game.app.screen;
        const side = Math.floor(Math.random() * 4);
        let x, y;
        // ... (if side === 0, 1, 2, 3 ... 保持不變)
        if (side === 0) { x = Math.random() * width; y = -50; }
        else if (side === 1) { x = width + 50; y = Math.random() * height; }
        else if (side === 2) { x = Math.random() * width; y = height + 50; }
        else { x = -50; y = Math.random() * height; }


        // ▼▼▼ 3. (修改) 隨機選擇一個敵人類型 ▼▼▼
        const type = this.spawnableTypes[Math.floor(Math.random() * this.spawnableTypes.length)];

        // ▼▼▼ 4. (修改) 呼叫 Game 的輔助函式，並傳入類型 ▼▼▼
        this.game.spawnEnemy(x, y, type);
    }
}