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

        this.nippleManager = null;
        // 將監聽函式綁定到 'this'，以便之後能正確移除
        this.keydownListener = this.handleKeydown.bind(this);
        this.keyupListener = this.handleKeyup.bind(this);

        this.setupInput();
        this.setupJoystick(); // <-- 呼叫新的函式
    }

    // ▼▼▼ 2. (修改) 拆分監聽器邏輯 ▼▼▼
    setupInput() {
        // 使用儲存的監聽器
        window.addEventListener('keydown', this.keydownListener);
        window.addEventListener('keyup', this.keyupListener);
    }

    handleKeydown(e) {
        this.keys[e.code] = true;
        if (e.code === 'Escape') {
            e.preventDefault(); 
            this.game.togglePause();
        }
    }

    handleKeyup(e) {
        this.keys[e.code] = false;
    }

    setupJoystick() {
        // ▼▼▼ 1. (修改) 將 zone 改為 document.body ▼▼▼
        const zone = document.body;
        
        const options = {
            zone: zone,
            mode: 'dynamic', 
            threshold: 0.1 
        };
        
        // ▼▼▼ 3. (修改) 儲存 manager ▼▼▼
        this.nippleManager = nipplejs.create(options);

        this.nippleManager.on('move', (evt, data) => {
            if (data.vector) {
                this.joystickVector.x = data.vector.x;
                this.joystickVector.y = -data.vector.y; 
                this.isJoystickActive = true;
            }
        });

        this.nippleManager.on('end', () => {
            this.joystickVector.x = 0;
            this.joystickVector.y = 0;
            this.isJoystickActive = false;
        });
    }

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
    
    /**
     * 清理此系統綁定的所有 DOM 監聽器
     */
    destroy() {
        // 移除 NippleJS 實例
        if (this.nippleManager) {
            this.nippleManager.destroy();
            this.nippleManager = null;
        }

        // 移除鍵盤監聽器
        window.removeEventListener('keydown', this.keydownListener);
        window.removeEventListener('keyup', this.keyupListener);
        
        console.log("PlayerInputSystem destroyed.");
    }
}