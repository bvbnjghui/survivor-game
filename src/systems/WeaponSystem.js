// src/systems/WeaponSystem.js
import { ActiveWeapons, Position, EnemyAI, PlayerStats } from '../core/components.js';
import { WEAPON_TYPES } from '../data/weaponTypes.js';

export class WeaponSystem {
    constructor(entityManager, game) {
        this.entityManager = entityManager;
        this.game = game; // 用於呼叫 game.spawnBullet / game.spawnAreaHitbox
        this.time = 0;
    }

    update(delta) {
        this.time += delta;

        // ▼▼▼ 2. 查詢時加入 PlayerStats ▼▼▼
        const shooters = this.entityManager.getEntitiesWithComponents(ActiveWeapons, Position, PlayerStats);

        for (const entityId of shooters) {
            const activeWeapons = this.entityManager.getComponent(entityId, ActiveWeapons);
            const playerPos = this.entityManager.getComponent(entityId, Position);
            // ▼▼▼ 3. 獲取 PlayerStats (帶有備援) ▼▼▼
            const stats = this.entityManager.getComponent(entityId, PlayerStats);
            const playerStats = stats || { attackSpeedMod: 1, damageMod: 1, areaMod: 1 };

            for (const weapon of activeWeapons.weapons) {
                const weaponData = WEAPON_TYPES[weapon.id][weapon.level];
                if (!weaponData) continue;

                // ▼▼▼ 4. (修改) 套用 attackSpeedMod ▼▼▼
                weapon.lastFired += delta;
                const fireInterval = (1.0 / weaponData.fireRate) / playerStats.attackSpeedMod;

                if (weapon.lastFired >= fireInterval) {
                    
                    // ... (findClosestEnemy 邏輯保持不變) ...
                    const closestEnemyInfo = this.findClosestEnemy(playerPos);

                    // ▼▼▼ 5. (修改) 應用 range/area 修正 (areaMod) ▼▼▼
                    // 注意：我們同時修改 'range' (索敵) 和 'radius' (特效)
                    const weaponRange = (weaponData.range || 0) * playerStats.areaMod;

                    if (closestEnemyInfo && closestEnemyInfo.distSq <= (weaponRange * weaponRange)) {
                        
                        weapon.lastFired = 0; 
                        
                        // ▼▼▼ 6. (修改) 建立 *修改後* 的武器資料 ▼▼▼
                        const modifiedData = {
                            ...weaponData,
                            damage: weaponData.damage * playerStats.damageMod,
                            radius: (weaponData.radius || 0) * playerStats.areaMod,
                            // (射彈武器的 'range' 是索敵用的，'lifetime' 不變)
                            lifetime: weaponData.lifetime, 
                            speed: weaponData.speed,
                        };
                        
                        // ▼▼▼ 7. (修改) 傳遞 modifiedData ▼▼▼
                        if (weaponData.type === 'projectile') {
                            this.fireProjectile(playerPos, closestEnemyInfo.target, modifiedData);
                        } else if (weaponData.type === 'area') {
                            this.spawnAreaEffect(playerPos, modifiedData);
                        }
                    }
                }
            }
        }
    }

    // --- 輔助函式 ---

    findClosestEnemy(playerPos) {
        const enemies = this.entityManager.getEntitiesWithComponents(EnemyAI, Position);
        let closestDistSq = Infinity;
        let closestTarget = null;

        for (const enemyId of enemies) {
            const enemyPos = this.entityManager.getComponent(enemyId, Position);
            if (!enemyPos) continue;

            const dx = enemyPos.x - playerPos.x;
            const dy = enemyPos.y - playerPos.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < closestDistSq) {
                closestDistSq = distSq;
                closestTarget = enemyPos;
            }
        }
        
        // 如果找到了敵人，回傳包含位置和平方距離的物件
        if (closestTarget) {
            return { target: closestTarget, distSq: closestDistSq };
        }
        // 否則回傳 null
        return null;
    }

    // 6. 重構：射彈邏輯
    fireProjectile(playerPos, targetPos, weaponData) {
        const dx = targetPos.x - playerPos.x;
        const dy = targetPos.y - playerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) return; // 避免除以零

        const vx = (dx / dist) * weaponData.speed;
        const vy = (dy / dist) * weaponData.speed;

        this.game.spawnBullet(
            playerPos.x, playerPos.y, 
            vx, vy, 
            weaponData.damage, 
            weaponData.lifetime // <-- 傳遞 lifetime
        );
    }

    // 7. 新增：範圍攻擊邏輯
    spawnAreaEffect(playerPos, weaponData) {
        this.game.spawnAreaHitbox(
            playerPos.x, playerPos.y, // <-- 跟隨玩家
            weaponData.radius,
            weaponData.damage,
            weaponData.duration
        );
    }
}