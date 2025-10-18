// This file handles the logic for performing the internet speed test.
// It includes functions to measure download and upload speeds and display the results.

import { bytesToMegabits, nowMs } from './utils.js';

/**
 * measureDownload(url, maxBytes, onProgress)
 * onProgress receives { bytes, elapsed, instantMbps, avgMbps }
 */
export async function measureDownload(url, maxBytes = 8 * 1024 * 1024, onProgress = () => {}) {
    const start = nowMs();
    let bytes = 0;
    let lastBytes = 0;
    let lastTime = start;
    try {
        const resp = await fetch(url + '?_=' + Date.now(), { cache: 'no-store' });
        if (!resp.ok || !resp.body) throw new Error('No stream available or failed to fetch');
        const reader = resp.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            const t = nowMs();
            if (done) break;
            bytes += value.byteLength;

            // instantaneous speed based on bytes since last tick
            const dt = (t - lastTime) / 1000 || 0.001;
            const dBytes = bytes - lastBytes;
            const instantMbps = bytesToMegabits(dBytes) / dt;
            const elapsed = (t - start) / 1000;
            const avgMbps = bytesToMegabits(bytes) / elapsed;

            onProgress({ bytes, elapsed, instantMbps, avgMbps });

            lastTime = t;
            lastBytes = bytes;

            if (bytes >= maxBytes) break;
        }
        const end = nowMs();
        const seconds = (end - start) / 1000;
        const mbps = bytesToMegabits(bytes) / seconds;
        return { mbps, bytes, seconds };
    } catch (err) {
        throw err;
    }
}

/**
 * measureUpload(url, mbSize, onProgress)
 * uses XMLHttpRequest to obtain upload progress events
 */
export function measureUpload(url, mbSize = 2, onProgress = () => {}) {
    return new Promise((resolve, reject) => {
        const sizeBytes = mbSize * 1024 * 1024;
        const chunk = new Uint8Array(1024);
        for (let i = 0; i < chunk.length; i++) chunk[i] = Math.floor(Math.random() * 256);
        const parts = [];
        let remaining = sizeBytes;
        while (remaining > 0) {
            const take = Math.min(remaining, chunk.length);
            parts.push(chunk.slice(0, take));
            remaining -= take;
        }
        const blob = new Blob(parts);

        const xhr = new XMLHttpRequest();
        const t0 = nowMs();
        xhr.open('POST', url, true);
        xhr.responseType = 'text';

        xhr.upload.onprogress = (e) => {
            const tNow = nowMs();
            const elapsed = (tNow - t0) / 1000;
            const instantMbps = bytesToMegabits(e.loaded) / Math.max(elapsed, 0.0001);
            const avgMbps = bytesToMegabits(e.loaded) / Math.max(elapsed, 0.0001);
            onProgress({ loaded: e.loaded, total: e.total || sizeBytes, elapsed, instantMbps, avgMbps });
        };

        xhr.onload = () => {
            const t1 = nowMs();
            const seconds = (t1 - t0) / 1000;
            const mbps = bytesToMegabits(sizeBytes) / Math.max(seconds, 0.0001);
            resolve({ mbps, sizeBytes, seconds, status: xhr.status });
        };

        xhr.onerror = () => {
            const t1 = nowMs();
            const seconds = (t1 - t0) / 1000;
            reject(new Error('Upload failed'));
        };

        xhr.send(blob);
    });
}

/**
 * measurePing(url, attempts)
 */
export async function measurePing(url, attempts = 3) {
    const results = [];
    for (let i = 0; i < attempts; i++) {
        const t0 = nowMs();
        try {
            await fetch(url + '?_=' + Date.now(), { method: 'GET', cache: 'no-store' });
            const t1 = nowMs();
            results.push(t1 - t0);
        } catch (err) {
            const t1 = nowMs();
            results.push(t1 - t0);
        }
    }
    results.sort((a, b) => a - b);
    return results[Math.floor(results.length / 2)];
}

// Event listener for starting the speed test
document.getElementById('start-test').addEventListener('click', runSpeedTest);