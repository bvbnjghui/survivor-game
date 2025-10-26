// src/utils/collision.js

/**
 * 檢查兩個圓形實體是否碰撞 (高效能)
 * @param {object} entityA - { x, y, radius }
 * @param {object} entityB - { x, y, radius }
 * @returns {boolean}
 */
export function checkCircleCollision(entityA, entityB) {
    const dx = entityB.x - entityA.x;
    const dy = entityB.y - entityA.y;
    
    // 我們比較「距離的平方」，以避免昂貴的「開根號 (Math.sqrt)」
    const distanceSq = (dx * dx) + (dy * dy);
    
    const sumOfRadii = entityA.radius + entityB.radius;
    const sumOfRadiiSq = sumOfRadii * sumOfRadii;

    return distanceSq < sumOfRadiiSq;
}