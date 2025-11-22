import { renderLogin } from './ui/login.js';
import { renderGroupSetup } from './ui/group_setup.js';
import { renderDashboard } from './ui/dashboard.js';
import { renderRoster } from './ui/roster.js';
import { renderCrew } from './ui/crew.js';
import { renderRules } from './ui/rules.js';
import { renderProfile } from './ui/profile.js';
import { renderTransactions } from './ui/transactions.js';
import { renderChat, stopChatPolling } from './ui/chat.js';
import { getState, updateState } from './state.js';
import { showToast } from './ui/toast.js';
import './sync.js'; // Start sync listener

// Expose app to window for global access (e.g. onclick in HTML)
window.app = {
    navigate: navigate,
    toggleTheme: toggleTheme,
    showToast: showToast
};

// Router
export function navigate(view) {
    const container = document.getElementById('view-container');
    const state = getState();
    const bottomNav = document.querySelector('.bottom-nav');

    // Clear current view
    container.innerHTML = '';

    // Handle Auth Guard
    if (!localStorage.getItem('token') && view !== 'login') {
        view = 'login';
    }

    console.log('Navigating to:', view);
    console.log('Current State:', state);

    // Auth Guard
    if (!state.token && view !== 'login') {
        console.log('Auth Guard Blocked');
        renderLogin();
        return;
    }

    // Group Guard
    if (state.token && !state.group && view !== 'group_setup' && view !== 'login') {
        console.log('Group Guard Blocked. Token exists but no Group.');
        renderGroupSetup();
        return;
    }

    // Hide/Show bottom nav based on view
    if (bottomNav) {
        if (view === 'chat') {
            bottomNav.style.display = 'none';
        } else {
            bottomNav.style.display = 'flex';
        }
    }

    // Update Nav Active State
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.target === view);
    });

    // Stop Chat Polling if leaving chat
    if (view !== 'chat') {
        stopChatPolling();
    }

    // Clear current view
    container.innerHTML = '';

    // Render the page content immediately
    switch (view) {
        case 'login':
            renderLogin();
            break;
        case 'group_setup':
            renderGroupSetup();
            break;
        case 'dashboard':
            renderDashboard();
            break;
        case 'roster':
            renderRoster();
            break;
        case 'crew':
            renderCrew();
            break;
        case 'rules':
            renderRules();
            break;
        case 'profile':
            renderProfile();
            break;
        case 'transactions':
            renderTransactions();
            break;
        case 'chat':
            renderChat();
            break;
        default:
            renderDashboard();
    }
}

// The updateActiveNav function is no longer needed as its logic is now inline within navigate.
// However, to maintain the structure of the original file, we'll keep the function definition
// but it will not be called from navigate anymore.
function updateActiveNav(view) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.target === view) {
            item.classList.add('active');
        }
    });
}

// Theme Logic
function toggleTheme() {
    const body = document.body;
    const current = body.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);

    // Update Icon
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
        icon.className = next === 'light' ? 'ph ph-sun' : 'ph ph-moon';
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Nav Click Handlers
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            navigate(item.dataset.target);
        });
    });

    // Init Theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    if (document.querySelector('#theme-toggle i')) {
        document.querySelector('#theme-toggle i').className = savedTheme === 'dark' ? 'ph ph-moon' : 'ph ph-sun';
    }

    const state = getState();

    // Initial Route
    if (state.token) {
        navigate('dashboard');
    } else {
        navigate('login');
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('SW Registered'))
            .catch(err => console.error('SW Fail', err));
    }
});
