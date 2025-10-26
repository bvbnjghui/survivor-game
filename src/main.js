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
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker registered successfully:', registration);

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification();
                        }
                    });
                }
            });

            // Check for updates on page load
            if (registration.waiting) {
                showUpdateNotification();
            }

        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }

    // PWA Update functionality
    function showUpdateNotification() {
        const notification = document.getElementById('update-notification');
        if (notification) {
            notification.style.display = 'block';
        }
    }

    function hideUpdateNotification() {
        const notification = document.getElementById('update-notification');
        if (notification) {
            notification.style.display = 'none';
        }
    }

    // Update button event listeners
    document.getElementById('update-now')?.addEventListener('click', () => {
        const registration = navigator.serviceWorker.controller;
        if (registration?.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    });

    document.getElementById('update-later')?.addEventListener('click', () => {
        hideUpdateNotification();
        // Store preference to remind later
        localStorage.setItem('update-dismissed-time', Date.now());
    });

    // Check for dismissed updates periodically
    setInterval(() => {
        const dismissedTime = localStorage.getItem('update-dismissed-time');
        if (dismissedTime && Date.now() - parseInt(dismissedTime) > 24 * 60 * 60 * 1000) { // 24 hours
            localStorage.removeItem('update-dismissed-time');
            // Re-check for updates
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistration().then(registration => {
                    if (registration?.waiting) {
                        showUpdateNotification();
                    }
                });
            }
        }
    }, 60000); // Check every minute
};