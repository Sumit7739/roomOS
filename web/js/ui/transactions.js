import { apiCall } from '../api.js';
import { showToast } from './toast.js';

export async function renderTransactions() {
    const container = document.getElementById('view-container');
    container.innerHTML = '<div class="flex-center p-4"><div class="loader">Loading...</div></div>';

    try {
        const token = localStorage.getItem('token');
        const res = await apiCall('/transactions/list', 'GET', null, token);

        const myBalance = parseFloat(res.my_balance);
        const transactions = res.transactions;
        const balances = res.balances;

        const isPositive = myBalance >= 0;
        const balanceColor = isPositive ? 'var(--success)' : 'var(--danger)';
        const balanceText = isPositive ? 'You are owed' : 'You owe';

        let html = `
            <div class="fade-in" style="padding-bottom: 80px;">
                <h1 class="mb-4">Expenses</h1>

                <!-- Balance Card -->
                <div class="card mb-4" style="background: linear-gradient(135deg, var(--bg-card), rgba(255,255,255,0.05));">
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 4px;">${balanceText}</div>
                    <div style="font-size: 2.5rem; font-weight: 700; color: ${balanceColor};">
                        ₹${Math.abs(myBalance).toFixed(2)}
                    </div>
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
        });

        saveBtn.addEventListener('click', async () => {
            const desc = document.getElementById('desc').value;
            const amount = document.getElementById('t-amount').value;
            if (!desc || !amount) return showToast('Please fill all fields', 'error');

            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            try {
                const token = localStorage.getItem('token');
                await apiCall('/transactions/add', 'POST', { description: desc, amount }, token);
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
