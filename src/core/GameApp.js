// src/core/GameApp.js
import { Game } from './Game.js';

/**
 * 頂層應用程式管理器
 * 負責：
 * 1. PIXI Application 的生命週期
 * 2. 遊戲狀態 (MainMenu, Playing)
 * 3. UI 菜單 (主選單, 暫停, 遊戲結束)
 * 4. Game Session (this.currentGame) 的建立與銷毀
 */
export class GameApp {
    constructor() {
        this.app = null;
        this.currentGame = null; // 當前遊戲會話的實例
        this.uiContainer = null; // 用於菜單的 HTML 容器

        this.loadingScreen = document.getElementById('loading-screen');
        this.inGameUI = document.getElementById('ui');
    }

    async init() {
        // 1. 建立 PIXI App
        this.app = new PIXI.Application();
        await this.app.init({
            resizeTo: window,
            autoDensity: true,
            background: 0x000000
        });
        document.body.appendChild(this.app.canvas);

        // 2. 建立 UI 容器
        this.uiContainer = document.createElement('div');
        this.uiContainer.id = 'ui-container';
        document.body.appendChild(this.uiContainer);

        // 3. 顯示主選單
        this.showMainMenu();
    }

    // --- UI 顯示邏輯 ---

    showMainMenu() {
        this.clearUI();

        if (this.loadingScreen) this.loadingScreen.style.display = 'none';
        if (this.inGameUI) this.inGameUI.style.display = 'none';

        const menu = this.createMenuElement('main-menu', [
            { text: 'Web Survivor', isTitle: true },
            { text: 'Start Game', action: () => this.startGame() },
            { text: 'High Scores', action: () => this.showHighScores() }
        ]);
        this.uiContainer.appendChild(menu);
    }

    showPauseMenu() {
        this.clearUI();

        if (this.inGameUI) this.inGameUI.style.display = 'none';

        const menu = this.createMenuElement('pause-menu', [
            { text: 'Paused', isTitle: true },
            { text: 'Resume Game', action: () => this.currentGame?.resumeInGame() },
            { text: 'Restart Game', action: () => this.restartGame() },
            { text: 'Main Menu', action: () => this.returnToMenu() }
        ]);
        this.uiContainer.appendChild(menu);
    }
    
    showGameOverMenu(score) {
        this.clearUI();

        if (this.inGameUI) this.inGameUI.style.display = 'none';

        const menu = this.createMenuElement('game-over-menu', [
            { text: 'Game Over', isTitle: true },
            { text: `Final Score: ${score}`, isStatic: true },
            { text: 'Restart Game', action: () => this.restartGame() },
            { text: 'Main Menu', action: () => this.returnToMenu() }
        ]);
        this.uiContainer.appendChild(menu);
    }

    showHighScores() {
        this.clearUI();
        const menu = document.createElement('div');
        menu.className = 'ui-overlay';

        const scores = this.getHighScores();
        let scoreHtml = '<h1 class="menu-title">High Scores</h1>';
        if (scores.length === 0) {
            scoreHtml += '<p>No scores yet!</p>';
        } else {
            scoreHtml += '<ol class="score-list">';
            scores.forEach(s => { scoreHtml += `<li>${s}</li>`; });
            scoreHtml += '</ol>';
        }
        
        menu.innerHTML = scoreHtml;
        
        const backButton = this.createButton('Back to Menu', () => this.showMainMenu());
        menu.appendChild(backButton);
        this.uiContainer.appendChild(menu);
    }

    // --- 遊戲流程控制 ---

    startGame() {
        this.clearUI();
        this.destroyCurrentGame(); // 清理舊的

        if (this.inGameUI) this.inGameUI.style.display = 'block';
        
        this.currentGame = new Game(this.app, this); // 建立新的
        this.currentGame.init(); // 初始化遊戲會話
    }
    
    restartGame() {
        this.startGame(); // 重啟就是開始一個新遊戲
    }

    returnToMenu() {
        this.clearUI();
        this.destroyCurrentGame();
        
        if (this.inGameUI) this.inGameUI.style.display = 'none';

        this.showMainMenu();
    }

    destroyCurrentGame() {
        if (this.currentGame) {
            this.currentGame.destroy();
            this.currentGame = null;
        }
    }

    // --- 高分榜邏輯 ---

    getHighScores() {
        try {
            return JSON.parse(localStorage.getItem('survivor_scores') || '[]');
        } catch (e) {
            return [];
        }
    }

    updateHighScores(score) {
        const scores = this.getHighScores();
        scores.push(score);
        scores.sort((a, b) => b - a); // 降序
        localStorage.setItem('survivor_scores', JSON.stringify(scores.slice(0, 5))); // 只保留前 5
    }

    // --- UI 輔助函式 ---

    clearUI() {
        this.uiContainer.innerHTML = ''; // 清空所有 UI
    }

    createMenuElement(id, items) {
        const overlay = document.createElement('div');
        overlay.id = id;
        overlay.className = 'ui-overlay';

        const menu = document.createElement('div');
        menu.className = 'ui-menu';

        items.forEach(item => {
            if (item.isTitle) {
                const title = document.createElement('h1');
                title.className = 'menu-title';
                title.textContent = item.text;
                menu.appendChild(title);
            } else if (item.isStatic) {
                const text = document.createElement('p');
                text.textContent = item.text;
                menu.appendChild(text);
            } else {
                const button = this.createButton(item.text, item.action);
                menu.appendChild(button);
            }
        });
        
        overlay.appendChild(menu);
        return overlay;
    }

    createButton(text, action) {
        const button = document.createElement('button');
        button.className = 'menu-button';
        button.textContent = text;
        button.onclick = action;
        return button;
    }
}