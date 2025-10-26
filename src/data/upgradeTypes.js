// src/data/upgradeTypes.js
import { PlayerStats, Health } from '../core/components.js';

// 定義所有可用的升級
export const UPGRADE_TYPES = {
    // 屬性升級
    'move_speed_1': {
        id: 'move_speed_1',
        name: 'Running Shoes',
        description: 'Movement Speed +10%',
        apply: (entityManager, playerEntity) => {
            const stats = entityManager.getComponent(playerEntity, PlayerStats);
            if (stats) stats.moveSpeed *= 1.10;
        }
    },
    'max_health_1': {
        id: 'max_health_1',
        name: 'Armor Vest',
        description: 'Max Health +20%. (Heals to full)',
        apply: (entityManager, playerEntity) => {
            const health = entityManager.getComponent(playerEntity, Health);
            if (health) {
                health.max = Math.floor(health.max * 1.20);
                health.current = health.max; // 升級時補滿血
            }
        }
    },
    'damage_1': {
        id: 'damage_1',
        name: 'Power Crystal',
        description: 'All Damage +10%',
        apply: (entityManager, playerEntity) => {
            const stats = entityManager.getComponent(playerEntity, PlayerStats);
            if (stats) stats.damageMod *= 1.10;
        }
    },
    'attack_speed_1': {
        id: 'attack_speed_1',
        name: 'Focus Gem',
        description: 'Attack Speed +10% (Cooldown -10%)',
        apply: (entityManager, playerEntity) => {
            const stats = entityManager.getComponent(playerEntity, PlayerStats);
            if (stats) stats.attackSpeedMod *= 1.10;
        }
    },
    'area_1': {
        id: 'area_1',
        name: 'Scope',
        description: 'Attack Area/Range +15%',
        apply: (entityManager, playerEntity) => {
            const stats = entityManager.getComponent(playerEntity, PlayerStats);
            if (stats) stats.areaMod *= 1.15;
        }
    },
    // (未來可以在此處添加武器升級，例如 'wand_level_2')
};

/**
 * 獲取 N 個隨機的升級選項
 * (簡易版：未來可擴充以避免重複升級)
 * @param {number} count - 要獲取的選項數量
 * @returns {Array<object>}
 */
export function getUpgradeOptions(count = 3) {
    const allIds = Object.keys(UPGRADE_TYPES);
    // 簡單洗牌並選取前 N 個
    const shuffled = allIds.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(id => UPGRADE_TYPES[id]);
}