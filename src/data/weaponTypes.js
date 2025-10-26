// src/data/weaponTypes.js

// 武器資料由這裡驅動
export const WEAPON_TYPES = {
    // 武器 1：您目前的子彈，我們叫它 "Wand"
    'wand': {
        // 等級 1 的數值
        1: {
            type: 'projectile', // 類型：射彈
            damage: 25,
            fireRate: 2,        // 每秒 2 次
            speed: 400,         // 射彈速度
            lifetime: 2.0,      // 射彈存活 2 秒
            range: 300,         // ▼▼▼ 新增：攻擊範圍 300px ▼▼▼
        },
        // (未來可以在此處添加 level 2, 3...)
    },

    // 武器 2：新的近戰範圍武器，我們叫它 "Aura"
    'aura': {
        // 等級 1 的數值
        1: {
            type: 'area',       // 類型：範圍
            damage: 10,
            fireRate: 2,        // 每秒攻擊 2 次
            radius: 75,         // 攻擊半徑 75px
            duration: 0.2,      // 攻擊判定持續 0.2 秒
            range: 75,          // ▼▼▼ 新增：攻擊範圍 75px (同半徑) ▼▼▼
        }
    }
};