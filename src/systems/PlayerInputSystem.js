// src/systems/PlayerInputSystem.js
// ▼▼▼ 1. 匯入 PlayerStats (來自您之前的升級) ▼▼▼
import { PlayerInput, Velocity, Position, PlayerStats } from '../core/components.js';

export class PlayerInputSystem {
    constructor(entityManager, game) {
        this.entityManager = entityManager;
        this.game = game;
        this.keys = {};
        
        // ▼▼▼ 2. 儲存搖桿狀態 ▼▼▼
        this.joystickVector = { x: 0, y: 0 };
        this.isJoystickActive = false;
        // ▲▲▲ 儲存完畢 ▲▲▲

        this.setupInput();
        this.setupJoystick(); // <-- 呼叫新的函式
    }

    setupInput() {
        // ... (鍵盤監聽 保持不變) ...
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape') {
                e.preventDefault(); 
                this.game.togglePause();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    // ▼▼▼ 3. (新增) 設置 NippleJS 虛擬搖桿 ▼▼▼
    setupJoystick() {
        // ▼▼▼ 1. (修改) 將 zone 改為 document.body ▼▼▼
        const zone = document.body;
        // (移除 if (!zone) ... 的檢查)

        const options = {
            zone: zone,
            // ▼▼▼ 2. (修改) 模式改為 'dynamic' ▼▼▼
            // 這會讓搖桿的中心點在您手指按下的位置
            mode: 'dynamic', 
            
            // ▼▼▼ 3. (移除) 移除靜態模式的選項 ▼▼▼
            // position: { ... }, // <-- 刪除
            // color: 'white',      // <-- 刪除
            // size: 100,           // <-- 刪除

            threshold: 0.1 
        };
        
        const manager = nipplejs.create(options);

        // (監聽 'move' 和 'end' 的邏輯 ... 保持不變)
        manager.on('move', (evt, data) => {
            if (data.vector) {
                this.joystickVector.x = data.vector.x;
                this.joystickVector.y = -data.vector.y; 
                this.isJoystickActive = true;
            }
        });

        manager.on('end', () => {
            this.joystickVector.x = 0;
            this.joystickVector.y = 0;
            this.isJoystickActive = false;
        });
    }
    // ▲▲▲ 新增完畢 ▲▲▲

    // ▼▼▼ 4. (重構) update 函式 ▼▼▼
    update(delta) {
        const players = this.entityManager.getEntitiesWithComponents(PlayerInput, Velocity, Position, PlayerStats);

        for (const entityId of players) {
            const input = this.entityManager.getComponent(entityId, PlayerInput);
            const velocity = this.entityManager.getComponent(entityId, Velocity);
            const stats = this.entityManager.getComponent(entityId, PlayerStats);
            const speed = stats ? stats.moveSpeed : 200;

            // --- 1. 重置輸入向量 ---
            let moveX = 0;
            let moveY = 0;

            // --- 2. 檢查鍵盤輸入 ---
            if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY = -1;
            if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY = 1;
            if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX = -1;
            if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX = 1;

            // --- 3. 檢查搖桿輸入 (如果搖桿在動，則覆蓋鍵盤) ---
            if (this.isJoystickActive) {
                moveX = this.joystickVector.x;
                moveY = this.joystickVector.y;
            }

            // --- 4. (重要) 正規化向量 (Normalization) ---
            // 這可以防止斜向移動速度過快
            const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
            if (magnitude > 1) { // (magnitude > 0 也可以，但 > 1 更精確)
                moveX /= magnitude;
                moveY /= magnitude;
            }

            // --- 5. 更新 PlayerInput 元件 (供其他系統讀取) ---
            input.moveX = moveX;
            input.moveY = moveY;

            // --- 6. 根據最終的向量設置速度 ---
            velocity.vx = input.moveX * speed;
            velocity.vy = input.moveY * speed;
        }
    }
    // ▲▲▲ 重構完畢 ▲▲▲
}