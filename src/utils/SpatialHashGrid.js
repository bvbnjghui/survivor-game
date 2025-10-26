// src/utils/SpatialHashGrid.js

/**
 * 空間雜湊網格，用於高效能的廣域碰撞偵測。
 * 遵循 CONTRIBUTING.md 的效能原則。
 */
export class SpatialHashGrid {
    constructor(worldWidth, worldHeight, cellSize) {
        this.cellSize = cellSize;
        this.gridWidth = Math.ceil(worldWidth / cellSize);
        this.gridHeight = Math.ceil(worldHeight / cellSize);
        this.grid = new Map(); // 使用 Map 來稀疏地儲存格子
    }

    /**
     * 清除網格，為新的一幀做準備
     */
    clear() {
        this.grid.clear();
    }

    /**
     * 將實體插入網格
     * @param {number} entityId - 實體的 ID
     * @param {number} x - 實體的 X 座標
     * @param {number} y - 實體的 Y 座標
     * @param {number} radius - 實體的碰撞半徑
     */
    insert(entityId, x, y, radius) {
        // 取得實體可能佔據的格子範圍
        const minX = Math.floor((x - radius) / this.cellSize);
        const maxX = Math.floor((x + radius) / this.cellSize);
        const minY = Math.floor((y - radius) / this.cellSize);
        const maxY = Math.floor((y + radius) / this.cellSize);

        for (let i = minX; i <= maxX; i++) {
            for (let j = minY; j <= maxY; j++) {
                const cellKey = this._hash(i, j);
                if (!this.grid.has(cellKey)) {
                    this.grid.set(cellKey, new Set());
                }
                this.grid.get(cellKey).add(entityId);
            }
        }
    }

    /**
     * 查詢在指定範圍附近的潛在碰撞實體
     * @param {number} x - 查詢中心的 X 座標
     * @param {number} y - 查詢中心的 Y 座標
     * @param {number} radius - 查詢的半徑
     * @returns {Set<number>} - 附近實體的 ID 集合
     */
    query(x, y, radius) {
        const potentialMatches = new Set();
        const minX = Math.floor((x - radius) / this.cellSize);
        const maxX = Math.floor((x + radius) / this.cellSize);
        const minY = Math.floor((y - radius) / this.cellSize);
        const maxY = Math.floor((y + radius) / this.cellSize);

        for (let i = minX; i <= maxX; i++) {
            for (let j = minY; j <= maxY; j++) {
                const cellKey = this._hash(i, j);
                if (this.grid.has(cellKey)) {
                    for (const entityId of this.grid.get(cellKey)) {
                        potentialMatches.add(entityId);
                    }
                }
            }
        }
        return potentialMatches;
    }

    /**
     * 將 2D 格子座標轉換為唯一的 1D Map Key
     */
    _hash(x, y) {
        // 使用一個簡單的字串 Key
        return `${x},${y}`;
    }
}