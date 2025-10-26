// src/main.js
import { GameApp } from './core/GameApp.js'; // <-- 1. 匯入 GameApp

window.onload = async () => {
    // 2. 建立 GameApp 而不是 Game
    const gameApp = new GameApp();
    await gameApp.init();

    console.log("GameApp initialized and running.");

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered successfully:', registration);
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }
};