// src/main.js
import { GameApp } from './core/GameApp.js'; // <-- 1. 匯入 GameApp

window.onload = async () => {
    // 2. 建立 GameApp 而不是 Game
    const gameApp = new GameApp();
    await gameApp.init();
    
    console.log("GameApp initialized and running.");
};