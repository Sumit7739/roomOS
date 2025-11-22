import { apiCall } from '../api.js';
import { showToast } from './toast.js';
import { getState } from '../state.js';
import { queueAction } from '../store.js';

export async function renderTransactions() {
    const container = document.getElementById('view-container');
    container.innerHTML = '<div class="flex-center p-4"><div class="loader">Loading...</div></div>';

    try {
        const token = localStorage.getItem('token');
        const [transRes, membersRes] = await Promise.all([
            apiCall('/transactions/list', 'GET', null, token),
            apiCall('/group/members', 'GET', null, token)
        ]);

        const myBalance = parseFloat(transRes.my_balance);
        const transactions = transRes.transactions;
        const balances = transRes.balances;
        const members = membersRes.members;

        // Calculate total expenses (sum of all transactions I made)
        const currentUser = getState().user;
        const myTransactions = transactions.filter(t => t.user_id === currentUser.id);
        const totalExpenses = myTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);


        const isPositive = myBalance >= 0;
        const balanceColor = isPositive ? 'var(--success)' : 'var(--danger)';
        const balanceText = isPositive ? 'You are owed' : 'You owe';

        let html = `
            <div class="fade-in" style="padding-bottom: 80px;">
                <h1 class="mb-4">Expenses</h1>

                <!-- Total Expenses Card -->
                <div class="card mb-4" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <div style="color: rgba(255,255,255,0.9); font-size: 0.9rem; margin-bottom: 4px;">Your Total Expenses</div>
                    <div style="font-size: 2.5rem; font-weight: 700; color: white;">
                        ₹${totalExpenses.toFixed(2)}
                    </div>
                </div>

                <!-- Overall Balance Card -->
                <div class="card mb-4" style="background: linear-gradient(135deg, var(--bg-card), rgba(255,255,255,0.05));">
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 4px;">${balanceText}</div>
                    <div style="font-size: 2.5rem; font-weight: 700; color: ${balanceColor};">
                        ₹${Math.abs(myBalance).toFixed(2)}
                    </div>
                </div>

                <!-- Individual Balances -->
                <div class="card mb-4">
                    <h3 style="font-size: 1rem; margin: 0 0 12px 0; color: var(--text-secondary);">Balance Breakdown</h3>
        `;

        // Show individual balances
        if (balances && balances.length > 0) {
            balances.forEach(balance => {
                const amount = parseFloat(balance.balance);
                if (amount === 0) return; // Skip zero balances

                // Find the user name by matching ID
                let userName = 'Unknown User';
                if (balance.other_user_id) {
                    const member = members.find(m => m.id === balance.other_user_id);
                    userName = member ? member.name : 'Unknown User';
                } else if (balance.other_user_name) {
                    userName = balance.other_user_name;
                } else if (balance.user_name) {
                    userName = balance.user_name;
                }

                const isOwed = amount > 0;
                const color = isOwed ? 'var(--success)' : 'var(--danger)';
                const icon = isOwed ? '↑' : '↓';
                const text = isOwed ? 'owes you' : 'you owe';

                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--bg-tertiary);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: ${color}20; display: flex; align-items: center; justify-content: center; font-weight: 700; color: ${color};">
                                ${userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style="font-weight: 600; color: var(--text-primary);">${userName}</div>
                                <div style="font-size: 0.8rem; color: var(--text-secondary);">${text}</div>
                            </div>
                        </div>
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${color};">
                            ${icon} ₹${Math.abs(amount).toFixed(2)}
                        </div>
                    </div>
                `;
            });
        } else {
            html += '<p style="color: var(--text-secondary); margin: 0;">All settled up! 🎉</p>';
        }

        html += `
                </div>

                <!-- Add Button -->
                <button id="add-expense-btn" class="btn btn-primary mb-4">
                    <span style="margin-right: 8px;">+</span> Add Expense
                </button>

                <!-- Add Form (Hidden) -->
                <div id="add-expense-form" class="card mb-4 hidden">
                    <h3 class="mb-4">New Expense</h3>
                    <div class="input-group">
                        <input type="text" id="desc" class="input-field" placeholder="Description (e.g. Milk)">
                    </div>
                    <div class="input-group">
                        <input type="number" id="amount" class="input-field" placeholder="Amount (₹)">
                    </div>
                    
                    <!-- User Selection -->
                    <div class="input-group">
                        <label style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; display: block;">Split between:</label>
                        <div id="user-checkboxes" style="display: flex; flex-direction: column; gap: 8px;">
        `;

        members.forEach(member => {
            html += `
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border-radius: var(--radius-md); background: var(--bg-input);">
                    <input type="checkbox" class="user-checkbox" value="${member.id}" checked style="width: 18px; height: 18px; cursor: pointer;">
                    <span style="font-size: 0.9rem; color: var(--text-primary);">${member.name}</span>
                </label>
            `;
        });

        html += `
                        </div>
                    </div>
                    
                    <div class="flex-center" style="gap: 10px;">
                        <button id="cancel-expense" class="btn" style="background: var(--bg-input);">Cancel</button>
                        <button id="save-expense" class="btn btn-primary">Save</button>
                    </div>
                </div>

                <!-- Recent List -->
                <h3 class="mb-2">Recent</h3>
                <div class="transactions-list">
        `;

        if (transactions.length === 0) {
            html += '<p style="color: var(--text-secondary);">No transactions yet.</p>';
        } else {
            transactions.forEach(t => {
                html += `
                    <div class="card mb-2" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600;">${t.description}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">Paid by ${t.user_name}</div>
                        </div>
                        <div style="font-weight: 700; color: var(--text-primary);">₹${parseFloat(t.amount).toFixed(2)}</div>
                    </div>
                `;
            });
        }

        html += '</div></div>';
        container.innerHTML = html;

        // Handlers
        const form = document.getElementById('add-expense-form');
        const addBtn = document.getElementById('add-expense-btn');
        const cancelBtn = document.getElementById('cancel-expense');
        const saveBtn = document.getElementById('save-expense');

        addBtn.addEventListener('click', () => {
            form.classList.remove('hidden');
            addBtn.classList.add('hidden');
        });

        cancelBtn.addEventListener('click', () => {
            form.classList.add('hidden');
            addBtn.classList.remove('hidden');
            // Reset form
            document.getElementById('desc').value = '';
            document.getElementById('amount').value = '';
            document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = true);
        });

        saveBtn.addEventListener('click', async () => {
            const desc = document.getElementById('desc').value;
            const amount = document.getElementById('amount').value;

            // Get selected user IDs
            const selectedUsers = Array.from(document.querySelectorAll('.user-checkbox:checked'))
                .map(cb => parseInt(cb.value));

            if (!desc || !amount) return showToast('Please fill all fields', 'error');
            if (selectedUsers.length === 0) return showToast('Please select at least one user', 'error');

            const payload = {
                description: desc,
                amount,
                split_between: selectedUsers
            };

            // Offline Handling
            if (!navigator.onLine) {
                // 1. Optimistic UI Update (Instant)
                const list = document.querySelector('.transactions-list');
                const tempHtml = `
                    <div class="card mb-2" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--warning);">
                        <div>
                            <div style="font-weight: 600;">${desc}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">Paid by You (Pending Sync)</div>
                        </div>
                        <div style="font-weight: 700; color: var(--text-primary);">₹${parseFloat(amount).toFixed(2)}</div>
                    </div>
                `;

                if (list.innerHTML.includes('No transactions yet')) {
                    list.innerHTML = tempHtml;
                } else {
                    list.innerHTML = tempHtml + list.innerHTML;
                }

                // Reset form immediately
                form.classList.add('hidden');
                addBtn.classList.remove('hidden');
                document.getElementById('desc').value = '';
                document.getElementById('amount').value = '';

                showToast('Saved offline. Will sync when online.', 'warning');

                // 2. Queue in background
                queueAction('/transactions/add', 'POST', payload).catch(e => {
                    console.error('Failed to queue offline action', e);
                    // Fallback to localStorage
                    const offline = JSON.parse(localStorage.getItem('offline_transactions') || '[]');
                    offline.push(payload);
                    localStorage.setItem('offline_transactions', JSON.stringify(offline));
                });

                return;
            }

            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            try {
                const token = localStorage.getItem('token');
                await apiCall('/transactions/add', 'POST', payload, token);
                showToast('Expense Added', 'success');
                renderTransactions(); // Refresh
            } catch (e) {
                showToast(e.message, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';
            }
        });


    } catch (error) {
        container.innerHTML = `<div class="p-4" style="color: var(--danger)">Error: ${error.message}</div>`;
    }
}
