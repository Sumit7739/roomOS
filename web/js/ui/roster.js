import { apiCall } from '../api.js';
import { showToast } from './toast.js';

export async function renderRoster() {
    const container = document.getElementById('view-container');
    container.innerHTML = '<div class="flex-center p-4"><div class="loader">Loading...</div></div>';

    try {
        const token = localStorage.getItem('token');
        const res = await apiCall('/roster/week', 'GET', null, token);
        const roster = res.roster;
        const isAdmin = res.role === 'admin'; // Or allow everyone to edit if desired

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0

        let html = `
            <div class="fade-in" style="padding-bottom: 80px;">
                <div style="text-align:center; margin-bottom:15px; color:var(--text-secondary); font-size:0.8rem;">
                    Tap a day to edit plan
                </div>
                <div id="roster-list">
        `;

        roster.forEach(day => {
            // Parse data. It might be ["Name"] or [{"n":"Name","t":"Time"}]
            let morning = JSON.parse(day.morning || '[]');
            let night = JSON.parse(day.night || '[]');

            // Normalize to objects
            morning = morning.map(x => typeof x === 'string' ? { n: x, t: '' } : x);
            night = night.map(x => typeof x === 'string' ? { n: x, t: '' } : x);

            const dayName = days[day.day_index];
            const isToday = day.day_index === todayIndex ? 'today-glow' : '';
            const todayBadge = day.day_index === todayIndex ? '<span class="today-tag">TODAY</span>' : '';

            // Helper to make pills
            const makePills = (arr) => arr.map(x =>
                `<div class="worker-chip"><span>${x.n}</span><span class="time-tiny">${x.t || ''}</span></div>`
            ).join('');

            html += `
                <div class="roster-card ${isToday} editable-day" data-day="${day.day_index}">
                    <div class="roster-header">
                        <span>${dayName}</span>
                        ${todayBadge}
                    </div>
                    
                    <div class="shift-row morning">
                        <div class="shift-label-row">
                            <span class="shift-icon">☀️ Morning</span>
                            ${day.passenger_m ? `<span class="pass-tag">🚫 ${day.passenger_m}</span>` : ''}
                        </div>
                        <div class="worker-list">
                            ${morning.length ? makePills(morning) : '<span style="font-size:0.8rem; opacity:0.5">Empty</span>'}
                        </div>
                    </div>

                    <div class="shift-row night">
                        <div class="shift-label-row">
                            <span class="shift-icon">🌙 Night</span>
                            ${day.passenger_n ? `<span class="pass-tag">🚫 ${day.passenger_n}</span>` : ''}
                        </div>
                        <div class="worker-list">
                            ${night.length ? makePills(night) : '<span style="font-size:0.8rem; opacity:0.5">Empty</span>'}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
        container.innerHTML = html;

        // Edit Handler
        // For now, we keep it simple but support the new structure
        // In a real app, this should be a proper Modal form
        document.querySelectorAll('.editable-day').forEach(el => {
            el.addEventListener('click', async () => {
                const dayIndex = el.dataset.day;
                const dayName = days[dayIndex];

                // Simple Prompt Flow
                if (!confirm(`Edit Roster for ${dayName}?`)) return;

                // Morning
                const m1n = prompt("Morning Person 1 Name:");
                const m1t = m1n ? prompt("Morning Person 1 Time (e.g. Till 11am):") : "";

                const m2n = prompt("Morning Person 2 Name:");
                const m2t = m2n ? prompt("Morning Person 2 Time:") : "";

                // Passenger M
                const pm = prompt("Morning Passenger (Off-Duty):");

                // Night
                const n1n = prompt("Night Person 1 Name:");
                const n1t = n1n ? prompt("Night Person 1 Time:") : "";

                const n2n = prompt("Night Person 2 Name:");
                const n2t = n2n ? prompt("Night Person 2 Time:") : "";

                // Passenger N
                const pn = prompt("Night Passenger (Off-Duty):");

                // Construct Data
                const morning = [];
                if (m1n) morning.push({ n: m1n, t: m1t });
                if (m2n) morning.push({ n: m2n, t: m2t });

                const night = [];
                if (n1n) night.push({ n: n1n, t: n1t });
                if (n2n) night.push({ n: n2n, t: n2t });

                try {
                    await apiCall('/roster/update', 'POST', {
                        day_index: dayIndex,
                        morning,
                        night,
                        passenger_m: pm || '',
                        passenger_n: pn || ''
                    }, token);
                    renderRoster(); // Refresh
                    showToast('Roster Updated', 'success');
                } catch (e) {
                    showToast(e.message, 'error');
                }
            });
        });

    } catch (error) {
        container.innerHTML = `<div class="p-4" style="color: var(--danger)">Error: ${error.message}</div>`;
    }
}
