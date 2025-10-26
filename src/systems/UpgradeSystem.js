// src/systems/UpgradeSystem.js
import { UPGRADE_TYPES, getUpgradeOptions } from '../data/upgradeTypes.js';

/**
 * 升級系統 (作為一個服務，而非在 update 迴圈中)
 * 負責：
 * 1. 顯示升級 UI
 * 2. 處理玩家選擇
 * 3. 套用升級
 * 4. 恢復遊戲
 */
export class UpgradeSystem {
    constructor(entityManager, game) {
        this.entityManager = entityManager;
        this.game = game; // 用於呼叫 game.resume()
        this.uiContainer = null;
    }

    /**
     * 由 Game.js 在 levelUp 時呼叫
     */
    showOptions() {
        // 1. 獲取 3 個隨機選項
        const options = getUpgradeOptions(3);

        // 2. 建立 UI 容器 (遮罩)
        this.uiContainer = document.createElement('div');
        this.uiContainer.id = 'upgrade-screen';
        this.uiContainer.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex; justify-content: center; align-items: center;
            flex-direction: column; z-index: 2000;
            font-family: Arial, sans-serif;
        `;

        // 3. 建立標題
        const title = document.createElement('h1');
        title.textContent = 'LEVEL UP! CHOOSE AN UPGRADE:';
        title.style.color = 'white';
        this.uiContainer.appendChild(title);

        // 4. 建立選項容器
        const optionsContainer = document.createElement('div');
        optionsContainer.style.display = 'flex';
        optionsContainer.style.gap = '20px';

        // 5. 為每個選項建立按鈕
        for (const upgrade of options) {
            const button = this.createUpgradeButton(upgrade);
            optionsContainer.appendChild(button);
        }

        this.uiContainer.appendChild(optionsContainer);
        document.body.appendChild(this.uiContainer);
    }

    /**
     * 建立單個升級按鈕
     */
    createUpgradeButton(upgrade) {
        const button = document.createElement('button');
        button.style.cssText = `
            width: 180px; 
            padding: 15px; 
            background: #333; 
            color: white;
            border: 2px solid #eee; 
            border-radius: 8px; 
            cursor: pointer;
            font-family: Arial, sans-serif;
            text-align: left;
        `;

        const nameEl = document.createElement('h3');
        nameEl.textContent = upgrade.name;
        nameEl.style.margin = '0 0 10px 0';
        nameEl.style.color = '#00ffff'; // 青色標題

        const descEl = document.createElement('p');
        descEl.textContent = upgrade.description;
        descEl.style.margin = '0';
        descEl.style.fontSize = '14px';

        button.appendChild(nameEl);
        button.appendChild(descEl);

        // 滑鼠懸停效果
        button.onmouseenter = () => {
            button.style.background = '#555';
            button.style.borderColor = '#00ffff';
        };
        button.onmouseleave = () => {
            button.style.background = '#333';
            button.style.borderColor = '#eee';
        };

        // 點擊事件
        button.onclick = () => this.onUpgradeChosen(upgrade.id);
        return button;
    }

    /**
     * 處理玩家的選擇
     */
    onUpgradeChosen(upgradeId) {
        // 1. 套用升級
        const upgrade = UPGRADE_TYPES[upgradeId];
        if (upgrade && upgrade.apply) {
            upgrade.apply(this.entityManager, this.game.playerEntity);
        }

        // 2. 移除 UI
        if (this.uiContainer) {
            this.uiContainer.remove();
            this.uiContainer = null;
        }

        // 3. 恢復遊戲
        this.game.resumeFromUpgrade();
    }
}