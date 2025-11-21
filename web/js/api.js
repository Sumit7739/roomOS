import { cacheData, getCachedData, queueAction } from './store.js';
import { showToast } from './ui/toast.js';

export const API_BASE = 'https://sumit11.serv00.net/roomOS/server/public';

export async function apiCall(endpoint, method = 'GET', body = null, token = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        // Try Network
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            // If Client Error (4xx), do NOT queue. Throw immediately.
            if (response.status >= 400 && response.status < 500) {
                throw new Error(data.error || 'Client Error');
            }
            throw new Error(data.error || 'Server Error');
        }

        // If GET, Cache it
        if (method === 'GET') {
            cacheData(endpoint, data).catch(console.error);
        }

        return data;
    } catch (error) {
        // If it was a 4xx error we threw above, re-throw it
        if (error.message !== 'Failed to fetch' && !error.message.includes('NetworkError')) {
            throw error;
        }

        console.warn('Network failed, falling back to offline mode:', error);

        // If GET, try Cache
        if (method === 'GET') {
            const cached = await getCachedData(endpoint);
            if (cached) {
                showToast('Offline Mode: Showing cached data', 'info');
                return cached;
            }
        }
        // If POST/PUT, Queue it (EXCEPT AUTH)
        else if (method === 'POST' || method === 'PUT') {
            if (endpoint.includes('/auth/')) {
                throw new Error('Cannot perform authentication while offline.');
            }

            await queueAction(endpoint, method, body);
            showToast('Offline: Action queued for sync', 'info');
            // We return a dummy success to keep UI moving if possible, or throw specific error
            // For now, let's throw but with a specific message UI can handle
            throw new Error('OFFLINE_QUEUED');
        }

        throw error;
    }
}
