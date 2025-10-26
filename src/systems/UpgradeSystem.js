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
        this.uiContainer.className = 'ui-overlay';

        // 3. 建立標題
        const title = document.createElement('h1');
        title.textContent = 'LEVEL UP! CHOOSE AN UPGRADE:';
        title.className = 'upgrade-title';
        this.uiContainer.appendChild(title);

        // 4. 建立選項容器
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'upgrade-options-container';

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
        button.className = 'upgrade-button';

        const nameEl = document.createElement('h3');
        nameEl.textContent = upgrade.name;

        const descEl = document.createElement('p');
        descEl.textContent = upgrade.description;

        button.appendChild(nameEl);
        button.appendChild(descEl);

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