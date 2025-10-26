// src/core/Game.js
import { EntityManager } from './EntityManager.js';
import { ObjectPool } from './ObjectPool.js';
import { PlayerInputSystem } from '../systems/PlayerInputSystem.js';
import { EnemyAISystem } from '../systems/EnemyAISystem.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { EnemySpawnerSystem } from '../systems/EnemySpawnerSystem.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { LifetimeSystem } from '../systems/LifetimeSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js'; 
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { BulletFactory } from '../entities/Bullet.js';
import { ENEMY_TYPES } from '../data/enemyTypes.js';
import { ExperienceOrbFactory } from '../entities/ExperienceOrb.js';
import { AreaHitboxFactory } from '../entities/AreaHitbox.js'; // <-- 1. 匯入

import { 
    Health, Position, Velocity, Collision, 
    EnemyAI, Bullet, Lifetime, Experience, ExperienceOrb,
    ActiveWeapons, AreaDamage, Sprite, EnemyType // <-- 2. 匯入新元件
} from '../core/components.js'; 
import { SpatialHashGrid } from '../utils/SpatialHashGrid.js';

export class Game {
    constructor(app, gameApp) { // 接收 app 和 gameApp
        this.app = app;         // 儲存 PIXI App 實例
        this.gameApp = gameApp; // 儲存 GameApp 管理器
        this.entityManager = new EntityManager();
        this.systems = [];
        this.world = null;
        this.spatialGrid = null;
        
        // (您之前為 'resize' 加入的系統引用，保持不變)
        this.movementSystem = null;
        this.collisionSystem = null;
        this.renderSystem = null; 
        
        this.upgradeSystem = null; 
        
        // ▼▼▼ (修改) 遊戲狀態 ▼▼▼
        this.gameState = 'PLAYING'; // 'PLAYING', 'PAUSED_UPGRADE', 'PAUSED_INGAME'

        // (物件池 pools, gameTime, UI 狀態 ... 保持不變)
        this.enemyPools = new Map();
        this.bulletPool = null;
        this.experienceOrbPool = null;
        this.areaHitboxPool = null;
        this.gameTime = 0;
        this.score = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.experience = { current: 0, nextLevel: 100, level: 1 };
        this.playerEntity = null;

        // ▼▼▼ (新增) 儲存 update 迴圈的綁定 ▼▼▼
        this.updateLoop = this.update.bind(this);
    }

    async init() {
        this.world = new PIXI.Container();
        document.body.appendChild(this.app.canvas);
        this.app.stage.addChild(this.world);

        // ▼▼▼ 4. (修改) 獲取並儲存初始邊界 ▼▼▼
        this.worldWidth = this.app.screen.width;
        this.worldHeight = this.app.screen.height;

        const cellSize = 64; 
        this.spatialGrid = new SpatialHashGrid(this.worldWidth, this.worldHeight, cellSize); // <-- 這裡也用到了
        this.playerEntity = Player.create(
            this.app, 
            this.entityManager, 
            this.worldWidth / 2, // <-- 修改這裡
            this.worldHeight / 2 // <-- 修改這裡
        );
        
        // --- 4. (修改) 建立 *多個* 敵人物件池 ---
        for (const [typeKey, typeData] of Object.entries(ENEMY_TYPES)) {
            // 為每種敵人創建一個專屬的 ObjectPool
            const pool = new ObjectPool(
                // CreateFunc: 
                // 建立時就傳入類型資料
                () => Enemy.create(this.app, this.entityManager, typeKey, typeData, this.playerEntity),
                
                // ResetFunc: 
                // 從池中取出時重置狀態
                (entityId) => {
                    // 獲取最新的類型資料 (以防未來有升級)
                    const typeComp = this.entityManager.getComponent(entityId, EnemyType);
                    const currentTypeData = ENEMY_TYPES[typeComp.type];
                    
                    const health = this.entityManager.getComponent(entityId, Health);
                    health.current = currentTypeData.health;
                    health.max = currentTypeData.health;
                    
                    const pos = this.entityManager.getComponent(entityId, Position);
                    pos.x = 0; pos.y = 0;
                    
                    const ai = this.entityManager.getComponent(entityId, EnemyAI);
                    ai.targetEntityId = this.playerEntity;
                    
                    const sprite = this.entityManager.getComponent(entityId, Sprite);
                    if (sprite.sprite) sprite.sprite.visible = true;
                    
                    // 確保 Collision 和 Velocity 存在
                    this.entityManager.addComponent(entityId, Velocity, new Velocity(0, 0));
                    this.entityManager.addComponent(entityId, Collision, new Collision(currentTypeData.radius));
                }
            );
            
            // 將這個池存入 Map
            this.enemyPools.set(typeKey, pool);
        }
        
        // --- 建立子彈物件池 (保持不變) ---
        this.bulletPool = new ObjectPool(
            () => BulletFactory.create(this.app, this.entityManager, 0),
            (entityId) => {
                const sprite = this.entityManager.getComponent(entityId, Sprite);
                if (sprite.sprite) sprite.sprite.visible = true;
                this.entityManager.addComponent(entityId, Velocity, new Velocity(0, 0));
                this.entityManager.addComponent(entityId, Collision, new Collision(4));
                // ▼▼▼ 4. 修改：使用預設值 2.0，spawn 時可覆蓋 ▼▼▼
                this.entityManager.addComponent(entityId, Lifetime, new Lifetime(2.0)); 
            }
        );

        // --- 5. 建立經驗球物件池 (新) ---
        this.experienceOrbPool = new ObjectPool(
            // 確保 'this.app' 被傳遞
            () => ExperienceOrbFactory.create(this.app, this.entityManager),
            (entityId) => {
                // 重置 Sprite
                const sprite = this.entityManager.getComponent(entityId, Sprite);
                if (sprite && sprite.sprite) {
                    sprite.sprite.visible = true;
                }
                
                // ▼▼▼ 這是 100% 遺失的 BUG 所在行 ▼▼▼
                // 加回 Collision 元件，使其可被拾取
                this.entityManager.addComponent(entityId, Collision, new Collision(5)); // 半徑 5
                // ▲▲▲ 確保您有這一行 ▲▲▲
            }
        );
        // --- 物件池建立完畢 ---
        // --- 5. 建立 AOE 物件池 (新) ---
        this.areaHitboxPool = new ObjectPool(
             // ▼▼▼ 2. 傳遞 'app' 給工廠 ▼▼▼
            () => AreaHitboxFactory.create(this.app, this.entityManager),
            (entityId) => {
                // 重置時，清空命中列表
                const area = this.entityManager.getComponent(entityId, AreaDamage);
                if (area) {
                    area.targetsHit.clear();
                }
                
                // ▼▼▼ 3. 顯示 Sprite ▼▼▼
                const sprite = this.entityManager.getComponent(entityId, Sprite);
                if (sprite && sprite.sprite) {
                    sprite.sprite.visible = true;
                }
                
                // 添加暫時元件
                this.entityManager.addComponent(entityId, Collision, new Collision(1));
                this.entityManager.addComponent(entityId, Lifetime, new Lifetime(0.1));
            }
        );
        // --- 物件池建立完畢 ---
        this.movementSystem = new MovementSystem(this.entityManager, this.worldWidth, this.worldHeight);
        this.collisionSystem = new CollisionSystem(this.entityManager, this, this.spatialGrid);
        this.renderSystem = new RenderSystem(this.entityManager, this.world);

        // 初始化所有 Systems
        this.systems = [
            new PlayerInputSystem(this.entityManager, this),
            new EnemyAISystem(this.entityManager),
            // ▼▼▼ 2. 將邊界傳遞給 MovementSystem ▼▼▼
            this.movementSystem, // (使用引用)
            this.collisionSystem, // (使用引用)
            new EnemySpawnerSystem(this),
            new WeaponSystem(this.entityManager, this),
            new LifetimeSystem(this.entityManager, this),
            this.renderSystem // <-- Render 必須在最後
        ];

        this.upgradeSystem = new UpgradeSystem(this.entityManager, this);

        // ▼▼▼ 6. (新增) 監聽 Pixi 的 resize 事件 ▼▼▼
        window.addEventListener('resize', () => {
            // 當視窗縮放時，PIXI 的 app.screen 會自動更新
            // 我們從這裡讀取新的尺寸並傳遞給 onResize 函式
            this.onResize(this.app.screen.width, this.app.screen.height);
        });
        
        // ... (啟動 Ticker)
        this.app.ticker.add(() => {
            const deltaSeconds = this.app.ticker.deltaMS / 1000.0;
            this.update(deltaSeconds);
        });
    }

    update(delta) {
        this.gameTime += delta; 

        if (this.gameState === 'PAUSED_UPGRADE' || this.gameState === 'PAUSED_INGAME') {
            // 暫停時，只更新渲染系統
            if (this.renderSystem) {
                this.renderSystem.update(delta);
            }
        } else {
            // 遊戲進行時，更新所有系統
            for (const system of this.systems) {
                system.update(delta);
            }
        }

        // --- 6. 更新 UI 狀態 ---
        const playerHealth = this.entityManager.getComponent(this.playerEntity, Health); 
        if (playerHealth) {
            this.health = Math.max(0, playerHealth.current);
        }
        
        const playerExp = this.entityManager.getComponent(this.playerEntity, Experience);
        if (playerExp) {
            this.experience.current = playerExp.current;
            this.experience.nextLevel = playerExp.nextLevel;
            this.experience.level = playerExp.level;
        }

        this.updateUI();
    }

    pause() {
        this.gameState = 'PAUSED';
    }

    resume() {
        this.gameState = 'PLAYING';
    }

    onResize(width, height) {
        // 更新儲存的尺寸
        this.worldWidth = width;
        this.worldHeight = height;

        // 1. 更新 MovementSystem 的邊界
        if (this.movementSystem) {
            this.movementSystem.updateBounds(width, height);
        }
        
        // 2. 重建 SpatialHashGrid (最安全的方式)
        const cellSize = this.spatialGrid.cellSize || 64;
        this.spatialGrid = new SpatialHashGrid(width, height, cellSize);
        
        // 3. 更新 CollisionSystem 中的 grid 引用
        if (this.collisionSystem) {
            this.collisionSystem.spatialGrid = this.spatialGrid;
        }

        // RenderSystem 和 PIXI.Container 會自動處理縮放，不需手動
        console.log(`Game resized to ${width}x${height}`);
    }

    // --- 7. 物件池輔助函式 (spawn/release) ---
    // ▼▼▼ 5. (修改) spawnEnemy 需傳入 type ▼▼▼
    spawnEnemy(x, y, type) { 
        const pool = this.enemyPools.get(type);
        if (!pool) {
            console.warn(`No object pool found for enemy type: ${type}`);
            return;
        }
        
        const enemyId = pool.get(); // 'get' 會自動呼叫 resetFunc
        const pos = this.entityManager.getComponent(enemyId, Position);
        if (pos) { pos.x = x; pos.y = y; }
    }

    // ▼▼▼ 6. (修改) releaseEnemy 需歸還到 *正確的* 池 ▼▼▼
    releaseEnemy(entityId) { 
        const typeComp = this.entityManager.getComponent(entityId, EnemyType);
        if (!typeComp) {
            // 如果沒有類型，直接銷毀 (備援)
            this.entityManager.destroyEntity(entityId);
            return;
        }
        
        const pool = this.enemyPools.get(typeComp.type);
        if (!pool) {
            console.warn(`No object pool found for enemy type: ${typeComp.type}`);
            this.entityManager.destroyEntity(entityId);
            return;
        }

        // 隱藏 Sprite 並移除暫時元件
        const sprite = this.entityManager.getComponent(entityId, Sprite);
        if (sprite && sprite.sprite) sprite.sprite.visible = false;
        this.entityManager.removeComponent(entityId, Collision);
        this.entityManager.removeComponent(entityId, Velocity);
        
        // 歸還
        pool.release(entityId);
    }

    // ▼▼▼ 6. 修改 spawnBullet ▼▼▼
    spawnBullet(x, y, vx, vy, damage, lifetimeVal = 2.0) { // <-- 接受 lifetimeVal
        const bulletId = this.bulletPool.get();
        
        const pos = this.entityManager.getComponent(bulletId, Position);
        if (pos) { pos.x = x; pos.y = y; }

        const vel = this.entityManager.getComponent(bulletId, Velocity);
        if (vel) { vel.vx = vx; vel.vy = vy; }

        const bullet = this.entityManager.getComponent(bulletId, Bullet);
        if (bullet) { bullet.damage = damage; }

        // 覆蓋 reset 時設定的預設值
        const lifetime = this.entityManager.getComponent(bulletId, Lifetime);
        if (lifetime) {
            lifetime.duration = lifetimeVal;
            lifetime.timer = lifetimeVal;
        }
    }

    releaseBullet(entityId) { /* ... (保持不變) ... */ 
        const sprite = this.entityManager.getComponent(entityId, Sprite);
        if (sprite && sprite.sprite) sprite.sprite.visible = false;
        this.entityManager.removeComponent(entityId, Collision);
        this.entityManager.removeComponent(entityId, Velocity);
        this.entityManager.removeComponent(entityId, Lifetime);
        this.bulletPool.release(entityId);
    }

    // ▼▼▼ 8. 經驗球輔助函式 (新) ▼▼▼
    /**
     * 從物件池中取出 (或建立) 一個經驗球
     */
    spawnExperienceOrb(x, y, value) {
        const orbId = this.experienceOrbPool.get(); // 'get' 會自動呼叫 resetFunc
        
        // 設定新位置
        const pos = this.entityManager.getComponent(orbId, Position);
        if (pos) {
            pos.x = x;
            pos.y = y;
        }
        
        // 設定經驗值
        const orb = this.entityManager.getComponent(orbId, ExperienceOrb);
        if (orb) {
            orb.value = value;
        }
    }

    /**
     * 將一個經驗球歸還物件池 (使其休眠)
     */
    releaseExperienceOrb(entityId) {
        // 隱藏 Sprite
        const sprite = this.entityManager.getComponent(entityId, Sprite);
        if (sprite && sprite.sprite) {
            sprite.sprite.visible = false;
        }

        // 移除關鍵元件，使其 "休眠"
        this.entityManager.removeComponent(entityId, Collision);

        // 歸還物件池
        this.experienceOrbPool.release(entityId);
    }

    // ▼▼▼ 7. 新增 AOE 輔助函式 ▼▼▼
    /**
     * 從物件池中取出 (或建立) 一個 AOE
     */
    spawnAreaHitbox(x, y, radius, damage, duration) {
        const hitboxId = this.areaHitboxPool.get();
        
        const pos = this.entityManager.getComponent(hitboxId, Position);
        if (pos) {
            pos.x = x;
            pos.y = y;
        }

        const area = this.entityManager.getComponent(hitboxId, AreaDamage);
        if (area) {
            area.damage = damage;
        }

        const col = this.entityManager.getComponent(hitboxId, Collision);
        if (col) {
            col.radius = radius;
        }

        const lifetime = this.entityManager.getComponent(hitboxId, Lifetime);
        if (lifetime) {
            lifetime.duration = duration;
            lifetime.timer = duration;
        }
        
        // ▼▼▼ 5. 更新 Sprite 大小以符合武器半徑 ▼▼▼
        const sprite = this.entityManager.getComponent(hitboxId, Sprite);
        if (sprite && sprite.sprite) {
            sprite.sprite.width = radius * 2;
            sprite.sprite.height = radius * 2;
        }
    }

    /**
     * 將一個 AOE 歸還物件池 (使其休眠)
     */
    // ▼▼▼ 6. 修改 releaseAreaHitbox (隱藏 Sprite) ▼▼▼
    releaseAreaHitbox(entityId) {
        // ▼▼▼ 隱藏 Sprite ▼▼▼
        const sprite = this.entityManager.getComponent(entityId, Sprite);
        if (sprite && sprite.sprite) {
            sprite.sprite.visible = false;
        }

        // 移除關鍵元件，使其 "休眠"
        this.entityManager.removeComponent(entityId, Collision);
        this.entityManager.removeComponent(entityId, Lifetime);
        
        // 歸還物件池
        this.areaHitboxPool.release(entityId);
    }

    // 遊戲中按 Esc 觸發
    togglePause() {
        if (this.gameState === 'PLAYING') {
            this.pauseInGame();
        } else if (this.gameState === 'PAUSED_INGAME') {
            this.resumeInGame();
        }
        // (如果是在 'PAUSED_UPGRADE' 狀態，按 Esc 不做事)
    }

    pauseInGame() {
        this.gameState = 'PAUSED_INGAME';
        this.gameApp.showPauseMenu(); // 呼叫 GameApp 顯示 UI
    }

    resumeInGame() {
        this.gameState = 'PLAYING';
        this.gameApp.clearUI(); // 呼叫 GameApp 清除 UI

        if (this.gameApp.inGameUI) {
            this.gameApp.inGameUI.style.display = 'block';
        }
    }

    // 升級時觸發
    pauseForUpgrade() {
        this.gameState = 'PAUSED_UPGRADE';
    }

    resumeFromUpgrade() {
        this.gameState = 'PLAYING';
    }
    
    // ▼▼▼ 10. 升級與經驗值邏輯 (新) ▼▼▼
    /**
     * 玩家獲得經驗值
     */
    grantXP(amount) {
        const exp = this.entityManager.getComponent(this.playerEntity, Experience);
        if (!exp) return;

        exp.current += amount;
        
        // 檢查是否升級 (可能一次升多級)
        while (exp.current >= exp.nextLevel) {
            this.levelUp(exp);
        }
    }

    /**
     * 處理玩家升級
     */
    levelUp(exp) {
        // ... (level up 邏輯 ... 保持不變)
        exp.current -= exp.nextLevel;
        exp.level++;
        exp.nextLevel = Math.floor(exp.nextLevel * 1.5);
        console.log(`LEVEL UP! New Level: ${exp.level}, Next: ${exp.nextLevel} XP`);

        // ▼▼▼ 8. (修改) 呼叫新的 pause 函式 ▼▼▼
        this.pauseForUpgrade(); // <-- pause() 改為 pauseForUpgrade()
        this.upgradeSystem.showOptions();
        // ▲▲▲ 修改完畢 ▲▲▲
    }


    updateUI() {
        // ▼▼▼ 9. (移動) 將 UI 更新邏輯移到這裡 ▼▼▼
        // (確保在 'PAUSED' 狀態下，血量等資訊也能被更新)
        const playerHealth = this.entityManager.getComponent(this.playerEntity, Health); 
        if (playerHealth) {
            // (確保 this.health 和 this.maxHealth 在 constructor 中已初始化)
            this.health = Math.max(0, playerHealth.current);
            this.maxHealth = playerHealth.max; // <-- (重要) 更新最大血量
        }
        
        const playerExp = this.entityManager.getComponent(this.playerEntity, Experience);
        if (playerExp) {
            this.experience.current = playerExp.current;
            this.experience.nextLevel = playerExp.nextLevel;
            this.experience.level = playerExp.level;
        }
        // ▲▲▲ 移動完畢 ▲▲▲
    
        // ... (更新 score, health-fill, xp-fill, xp-label 的 DOM 邏輯 ... 保持不變)
        const scoreElement = document.getElementById('score');
        if (scoreElement) scoreElement.textContent = `Score: ${this.score}`;

        const healthFill = document.getElementById('health-fill');
        if (healthFill) {
            const healthPercentage = (this.health / this.maxHealth) * 100;
            healthFill.style.width = `${healthPercentage}%`;
        }

        const xpFill = document.getElementById('xp-fill');
        if (xpFill) {
            const xpPercentage = (this.experience.current / this.experience.nextLevel) * 100;
            xpFill.style.width = `${xpPercentage}%`;
        }
        const xpLabel = document.getElementById('xp-label');
        if (xpLabel) {
            xpLabel.textContent = `LVL: ${this.experience.level}`;
        }
    }

    // ... (addScore, takeDamage, heal, gameOver 保持不變)
    addScore(points) { this.score += points; }
    takeDamage(damage) { this.health = Math.max(0, this.health - damage); }
    heal(amount) { this.health = Math.min(this.maxHealth, this.health + amount); }
    gameOver() {
        console.log("Game Over! Final Score:", this.score);
        this.gameState = 'PAUSED_INGAME'; // 停止遊戲邏輯
        this.app.ticker.remove(this.updateLoop); // 停止此遊戲的 update
        
        // 呼叫 GameApp 處理
        this.gameApp.updateHighScores(this.score);
        this.gameApp.showGameOverMenu(this.score);
    }

    // ▼▼▼ 10. (新增) destroy 函式 ▼▼▼
    /**
     * 由 GameApp 呼叫，用於銷毀此遊戲會話
     */
    destroy() {
        // 1. 停止 Ticker
        this.app.ticker.remove(this.updateLoop);

        // 2. 清除所有系統和實體
        this.systems = [];
        this.entityManager.destroyAllEntities();
        
        // 3. (可選) 清空物件池
        this.enemyPools.clear();
        this.bulletPool = null;
        this.experienceOrbPool = null;
        this.areaHitboxPool = null;

        // 4. 從 PIXI 移除 World Container
        this.app.stage.removeChild(this.world);
        this.world.destroy({ children: true });
        
        console.log("Game Session Destroyed.");
    }
}