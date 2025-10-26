// src/core/components.js

// 位置元件
export class Position {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

// 速度元件
export class Velocity {
    constructor(vx = 0, vy = 0) {
        this.vx = vx;
        this.vy = vy;
    }
}

// 血量元件
export class Health {
    constructor(current = 100, max = 100) {
        this.current = current;
        this.max = max;
    }
}

// 渲染元件 (Sprite)
export class Sprite {
    constructor(texture, width = 32, height = 32) {
        this.texture = texture;
        this.width = width;
        this.height = height;
        this.sprite = null; // PixiJS sprite 實例
    }
}

// 碰撞元件 (圓形)
export class Collision {
    constructor(radius = 16) {
        this.radius = radius;
    }
}

// 玩家輸入元件
export class PlayerInput {
    constructor() {
        // 移除 up, down, left, right
        // 改為儲存標準化的移動向量
        this.moveX = 0;
        this.moveY = 0;
        this.shoot = false; // (shoot 保持不變)
    }
}

// 敵人 AI 元件
export class EnemyAI {
    constructor(targetEntityId = null) {
        this.targetEntityId = targetEntityId;
        this.behavior = 'chase'; // 'chase', 'wander', etc.
    }
}

// ▼▼▼ 新增 敵人類型元件 ▼▼▼
export class EnemyType {
    constructor(type = 'bat') {
        this.type = type;
    }
}
// ▲▲▲ 新增結束 ▲▲▲

// 子彈元件
export class Bullet {
    constructor(damage = 10) {
        this.damage = damage;
    }
}

// 生命週期元件
export class Lifetime {
    constructor(duration = 1.0) { // 預設 1 秒
        this.duration = duration;
        this.timer = duration;
    }
}

// 經驗值元件 (for Player)
export class Experience {
    constructor(current = 0, nextLevel = 100, level = 1) {
        this.current = current;
        this.nextLevel = nextLevel;
        this.level = level;
    }
}

// 經驗球元件 (for Orbs)
export class ExperienceOrb {
    constructor(value = 10) {
        this.value = value;
    }
}

// 玩家武器庫元件
export class ActiveWeapons {
    constructor() {
        // 儲存玩家擁有的武器
        // 每個武器是一個物件 { id: 'wand', level: 1, lastFired: 0 }
        this.weapons = [];
    }
}

// 範圍傷害元件 (for AOE Hitboxes)
export class AreaDamage {
    constructor(damage = 5) {
        this.damage = damage;
        // 用於確保 AOE 在其生命週期中只擊中每個敵人一次
        this.targetsHit = new Set();
    }
}

export class PlayerStats {
    constructor(
        moveSpeed = 200, 
        attackSpeedMod = 1.0, 
        damageMod = 1.0, 
        areaMod = 1.0
    ) {
        this.moveSpeed = moveSpeed;         // 基礎移動速度
        this.attackSpeedMod = attackSpeedMod; // 攻擊速度 (乘數)
        this.damageMod = damageMod;       // 傷害 (乘數)
        this.areaMod = areaMod;         // 範圍 (乘數)
    }
}