import { apiCall } from '../api.js';
import { navigate } from '../app.js';
import { updateState } from '../state.js';
import { showToast } from './toast.js';

export function renderGroupSetup() {
    const container = document.getElementById('view-container');

    container.innerHTML = `
        <div class="fade-in" style="margin-top: 10vh;">
            <h1 class="mb-4">Setup Group</h1>
            <p class="mb-4">You need to join a flat/room group to continue.</p>
            
            <div class="card mb-4">
                <h2 class="mb-4">Create New Group</h2>
                <div class="input-group">
                    <input type="text" id="new-group-name" class="input-field" placeholder="Group Name (e.g. Flat 302)">
                </div>
                <button id="create-group-btn" class="btn btn-primary">Create Group</button>
            </div>

            <div class="flex-center mb-4">
                <span style="color: var(--text-secondary)">OR</span>
            </div>

            <div class="card">
                <h2 class="mb-4">Join Existing Group</h2>
                <div class="input-group">
                    <input type="number" id="join-group-id" class="input-field" placeholder="Group ID">
                </div>
                <button id="join-group-btn" class="btn" style="background: var(--bg-input); color: white;">Join Group</button>
            </div>
        </div>
    `;

    // Create Handler
    document.getElementById('create-group-btn').addEventListener('click', async () => {
        const name = document.getElementById('new-group-name').value;
        if (!name) return alert('Please enter a name');

        try {
            const token = localStorage.getItem('token');
            const res = await apiCall('/group/create', 'POST', { name }, token);

            // Update State
            const user = JSON.parse(localStorage.getItem('user'));
            user.group_id = res.group_id;
            user.role = 'admin';

            updateState('user', user);
            updateState('group', { id: res.group_id, name: name });

            showToast(`Group Created! ID: ${res.group_id}`, 'success');
            navigate('dashboard');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    // Join Handler
    document.getElementById('join-group-btn').addEventListener('click', async () => {
        const groupId = document.getElementById('join-group-id').value;
        if (!groupId) return alert('Please enter a Group ID');

        try {
            const token = localStorage.getItem('token');
            await apiCall('/group/join', 'POST', { group_id: groupId }, token);

            // Update State
            const user = JSON.parse(localStorage.getItem('user'));
            user.group_id = groupId;

            updateState('user', user);
            updateState('group', { id: groupId, name: 'My Group' }); // We don't know name yet, but ID is enough for guard

            showToast('Joined group successfully!', 'success');
            navigate('dashboard');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}
