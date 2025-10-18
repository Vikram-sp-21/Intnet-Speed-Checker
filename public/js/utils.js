/**
 * Utilities for measuring and formatting speeds.
 */

export function bytesToMegabits(bytes) {
    return (bytes * 8) / (1024 * 1024); // megabits
}

export function formatMbps(value) {
    if (value === Infinity || isNaN(value)) return '-- Mbps';
    if (value < 1) return value.toFixed(2) + ' Mbps';
    if (value < 10) return value.toFixed(2) + ' Mbps';
    return Math.round(value) + ' Mbps';
}

export function nowMs() {
    return performance && performance.now ? performance.now() : Date.now();
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function fetchJson(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}