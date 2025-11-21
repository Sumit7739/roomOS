import { apiCall } from '../api.js';
import { showToast } from './toast.js';
import { getState } from '../state.js';

export async function renderProfile() {
    const container = document.getElementById('view-container');
    container.innerHTML = '<div class="flex-center p-4"><div class="loader">Loading...</div></div>';

    try {
        const token = localStorage.getItem('token');
        const state = getState();
        const user = state.user;

        // TODO: Fetch user schedule from backend
        // For now, use localStorage
        const schedule = JSON.parse(localStorage.getItem('user_schedule') || 'null');

        let html = `
            <div class="fade-in" style="padding-bottom: 100px;">
                <h1 style="margin-bottom: var(--space-md); font-size: 1.75rem; font-weight: 800;">Profile</h1>
                
                <!-- User Info Card -->
                <div class="card">
                    <h2>Account Information</h2>
                    <div style="display: flex; align-items: center; gap: var(--space-lg); margin-bottom: var(--space-lg);">
                        <div style="
                            width: 64px;
                            height: 64px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: var(--accent-gradient);
                            border-radius: var(--radius-lg);
                            font-size: 2rem;
                            font-weight: 800;
                            color: white;
                        ">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 4px 0; font-size: 1.25rem;">${user.name}</h3>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${user.email}</p>
                        </div>
                    </div>
                    <div style="padding: var(--space-md); background: var(--bg-elevated); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--text-secondary); font-size: 0.85rem;">Role</span>
                        <span style="font-weight: 700; color: var(--accent-primary);">${user.role || 'Member'}</span>
                    </div>
                </div>

                <!-- Weekly Schedule Card -->
                <div class="card">
                    <h2>Weekly Class Schedule</h2>
                    <p style="margin: 0 0 var(--space-lg) 0; color: var(--text-secondary); font-size: 0.85rem;">
                        Set your class times to help auto-generate the weekly plan
                    </p>
                    <div id="schedule-container">
                        ${renderScheduleForm(schedule)}
                    </div>
                    <button id="save-schedule-btn" class="btn btn-primary" style="margin-top: var(--space-lg);">
                        Save Schedule
                    </button>
                </div>

                <!-- Settings Card -->
                <div class="card">
                    <h2>Settings</h2>
                    <div style="display: flex; flex-direction: column; gap: var(--space-md);">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-md); background: var(--bg-elevated); border-radius: var(--radius-md);">
                            <span>Notifications</span>
                            <label style="position: relative; display: inline-block; width: 50px; height: 28px;">
                                <input type="checkbox" id="notif-toggle" style="opacity: 0; width: 0; height: 0;">
                                <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--bg-tertiary); transition: 0.3s; border-radius: 28px;"></span>
                            </label>
                        </div>
                        <button class="btn" style="background: var(--danger); color: white;" onclick="logout()">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Attach event listener for save schedule
        document.getElementById('save-schedule-btn').addEventListener('click', saveSchedule);

    } catch (error) {
        container.innerHTML = `<div class="p-4" style="color: var(--danger)">Error: ${error.message}</div>`;
    }
}

function renderScheduleForm(schedule) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let html = '';

    days.forEach(day => {
        const daySchedule = schedule?.[day] || { start: '', end: '' };
        html += `
            <div style="margin-bottom: var(--space-md); padding: var(--space-md); background: var(--bg-elevated); border-radius: var(--radius-md);">
                <div style="font-weight: 600; margin-bottom: var(--space-sm); color: var(--text-primary);">${day}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm);">
                    <div>
                        <label style="display: block; font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">Start Time</label>
                        <input 
                            type="time" 
                            class="input-field schedule-input" 
                            data-day="${day}" 
                            data-type="start"
                            value="${daySchedule.start}"
                            style="margin-bottom: 0;"
                        >
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px;">End Time</label>
                        <input 
                            type="time" 
                            class="input-field schedule-input" 
                            data-day="${day}" 
                            data-type="end"
                            value="${daySchedule.end}"
                            style="margin-bottom: 0;"
                        >
                    </div>
                </div>
            </div>
        `;
    });

    return html;
}

function saveSchedule() {
    const inputs = document.querySelectorAll('.schedule-input');
    const schedule = {};

    inputs.forEach(input => {
        const day = input.dataset.day;
        const type = input.dataset.type;

        if (!schedule[day]) {
            schedule[day] = { start: '', end: '' };
        }

        schedule[day][type] = input.value;
    });

    // Save to localStorage (TODO: Save to backend)
    localStorage.setItem('user_schedule', JSON.stringify(schedule));

    showToast('Schedule saved successfully!', 'success');

    // TODO: Check if all group members have completed their schedules
    // If yes, trigger auto-plan generation
}

// Expose logout function globally
window.logout = function () {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.reload();
    }
};
