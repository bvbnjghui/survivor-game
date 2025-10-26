// src/systems/CollisionSystem.js
// ▼▼▼ 1. 匯入 Experience 和 ExperienceOrb ▼▼▼
import { 
    Position, Collision, Health, PlayerInput, EnemyAI, 
    Bullet, Experience, ExperienceOrb, AreaDamage, EnemyType
} from '../core/components.js';
import { checkCircleCollision } from '../utils/collision.js';
import { ENEMY_TYPES } from '../data/enemyTypes.js';

export class CollisionSystem {
    constructor(entityManager, game, spatialGrid) {
        this.entityManager = entityManager;
        this.game = game;
        this.spatialGrid = spatialGrid;
    }

    update(delta) {
        // --- 階段 1：清除並填充網格 ---
        this.spatialGrid.clear();
        const collidableEntities = this.entityManager.getEntitiesWithComponents(Position, Collision);

        for (const entity of collidableEntities) {
            const pos = this.entityManager.getComponent(entity, Position);
            const col = this.entityManager.getComponent(entity, Collision);
            // 檢查：確保實體未在迭代中被銷毀
            if (pos && col) { 
                this.spatialGrid.insert(entity, pos.x, pos.y, col.radius);
            }
        }

        // --- 階段 2：查詢和處理碰撞 ---
        for (const entityA of collidableEntities) {
            // 檢查 A 是否還存在 (可能已被前一次碰撞移除)
            const posA = this.entityManager.getComponent(entityA, Position);
            const colA = this.entityManager.getComponent(entityA, Collision);
            if (!posA || !colA) {
                continue;
            }

            const potentialNeighbors = this.spatialGrid.query(posA.x, posA.y, colA.radius);

            for (const entityB of potentialNeighbors) {
                if (entityA >= entityB) continue; // 避免 A-B 和 B-A 重複

                const posB = this.entityManager.getComponent(entityB, Position);
                const colB = this.entityManager.getComponent(entityB, Collision);
                if (!posB || !colB) continue; // 檢查 B 是否還存在

                const collisionA = { x: posA.x, y: posA.y, radius: colA.radius };
                const collisionB = { x: posB.x, y: posB.y, radius: colB.radius };

                if (checkCircleCollision(collisionA, collisionB)) {
                    this.handleCollision(entityA, entityB);
                }
            }
        }
    }

    /**
     * 處理兩個已確認碰撞的實體
     */
    handleCollision(entityA, entityB) {
        // 檢查所有可能的類型
        const isPlayerA = this.entityManager.hasComponent(entityA, PlayerInput);
        const isEnemyA = this.entityManager.hasComponent(entityA, EnemyAI);
        const isBulletA = this.entityManager.hasComponent(entityA, Bullet);
        const isOrbA = this.entityManager.hasComponent(entityA, ExperienceOrb);
        const isAreaA = this.entityManager.hasComponent(entityA, AreaDamage);

        const isPlayerB = this.entityManager.hasComponent(entityB, PlayerInput);
        const isEnemyB = this.entityManager.hasComponent(entityB, EnemyAI);
        const isBulletB = this.entityManager.hasComponent(entityB, Bullet);
        const isOrbB = this.entityManager.hasComponent(entityB, ExperienceOrb);
        const isAreaB = this.entityManager.hasComponent(entityB, AreaDamage);

        // ▼▼▼ 2. 獲取類型元件 (可能為 A 或 B) ▼▼▼
        const typeA = this.entityManager.getComponent(entityA, EnemyType);
        const typeB = this.entityManager.getComponent(entityB, EnemyType);

        // 情況 1： 玩家 vs 敵人
        if ((isPlayerA && isEnemyB) || (isPlayerB && isEnemyA)) {
            const playerEntity = isPlayerA ? entityA : entityB;
            const enemyEntity = isPlayerA ? entityB : entityA;
            const playerHealth = this.entityManager.getComponent(playerEntity, Health);
            const enemyHealth = this.entityManager.getComponent(enemyEntity, Health);
            const damageToPlayer = 10;
            const damageToEnemy = 50; // (這個傷害未來也可以改為資料驅動)

            // ▼▼▼ 3. 獲取敵人資料 ▼▼▼
            const enemyTypeComp = isPlayerA ? typeB : typeA;
            const enemyTypeData = enemyTypeComp ? ENEMY_TYPES[enemyTypeComp.type] : null;
            const scoreValue = enemyTypeData ? enemyTypeData.score : 50;
            const xpValue = enemyTypeData ? enemyTypeData.xp : 10;

            if (playerHealth) {
                playerHealth.current -= damageToPlayer;
                if (playerHealth.current <= 0) this.game.gameOver();
            }
            if (enemyHealth) {
                enemyHealth.current -= damageToEnemy;
                if (enemyHealth.current <= 0) {
                    // ▼▼▼ 4. (修改) 使用資料中的分數和XP ▼▼▼
                    this.game.addScore(scoreValue); 
                    const enemyPos = this.entityManager.getComponent(enemyEntity, Position);
                    if (enemyPos) {
                        this.game.spawnExperienceOrb(enemyPos.x, enemyPos.y, xpValue);
                    }
                    this.game.releaseEnemy(enemyEntity);
                }
            }
        }
        // 情況 2：子彈 vs 敵人
        else if ((isBulletA && isEnemyB) || (isBulletB && isEnemyA)) {
            const bulletEntity = isBulletA ? entityA : entityB;
            const enemyEntity = isBulletA ? entityB : entityA;
            const bullet = this.entityManager.getComponent(bulletEntity, Bullet);
            const enemyHealth = this.entityManager.getComponent(enemyEntity, Health);
            
            // ▼▼▼ 5. 獲取敵人資料 ▼▼▼
            const enemyTypeComp = isBulletA ? typeB : typeA;
            const enemyTypeData = enemyTypeComp ? ENEMY_TYPES[enemyTypeComp.type] : null;
            const scoreValue = enemyTypeData ? enemyTypeData.score : 100;
            const xpValue = enemyTypeData ? enemyTypeData.xp : 10;

            if (enemyHealth && bullet) {
                enemyHealth.current -= bullet.damage;
                if (enemyHealth.current <= 0) {
                    // ▼▼▼ 6. (修改) 使用資料中的分數和XP ▼▼▼
                    this.game.addScore(scoreValue);
                    const enemyPos = this.entityManager.getComponent(enemyEntity, Position);
                    if (enemyPos) {
                        this.game.spawnExperienceOrb(enemyPos.x, enemyPos.y, xpValue);
                    }
                    this.game.releaseEnemy(enemyEntity);
                }
            }
            this.game.releaseBullet(bulletEntity);
        }
        
        // ▼▼▼ 修正點：您 100% 遺漏了這個區塊 ▼▼▼
        // 情況 3：玩家 vs 經驗球
        else if ((isPlayerA && isOrbB) || (isPlayerB && isOrbA)) {
            const orbEntity = isPlayerA ? entityB : entityA;
            const orb = this.entityManager.getComponent(orbEntity, ExperienceOrb);

            if (orb) {
                this.game.grantXP(orb.value); // 呼叫 Game 增加經驗值
            }
            
            this.game.releaseExperienceOrb(orbEntity); // 歸還經驗球池
        }
        // ▲▲▲ 修正點結束 ▲▲▲

        // 情況 4：範圍攻擊(Aura) vs 敵人
        else if ((isAreaA && isEnemyB) || (isAreaB && isEnemyA)) {
            const areaEntity = isAreaA ? entityA : entityB;
            const enemyEntity = isAreaA ? entityB : entityA;
            const area = this.entityManager.getComponent(areaEntity, AreaDamage);
            const enemyHealth = this.entityManager.getComponent(enemyEntity, Health);

            // ▼▼▼ 7. 獲取敵人資料 ▼▼▼
            const enemyTypeComp = isAreaA ? typeB : typeA;
            const enemyTypeData = enemyTypeComp ? ENEMY_TYPES[enemyTypeComp.type] : null;
            const scoreValue = enemyTypeData ? enemyTypeData.score : 10;
            const xpValue = enemyTypeData ? enemyTypeData.xp : 10;

            if (!area || !enemyHealth) return; 

            if (!area.targetsHit.has(enemyEntity)) {
                area.targetsHit.add(enemyEntity); 
                
                enemyHealth.current -= area.damage;
                if (enemyHealth.current <= 0) {
                    // ▼▼▼ 8. (修改) 使用資料中的分數和XP ▼▼▼
                    this.game.addScore(scoreValue);
                    const enemyPos = this.entityManager.getComponent(enemyEntity, Position);
                    if (enemyPos) {
                        this.game.spawnExperienceOrb(enemyPos.x, enemyPos.y, xpValue);
                    }
                    this.game.releaseEnemy(enemyEntity);
                }
            }
        }
    }
}