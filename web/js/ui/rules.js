export function renderRules() {
    const container = document.getElementById('view-container');

    const rules = [
        { num: 1, text: "Respect everyone's space and belongings" },
        { num: 2, text: "Clean up after yourself immediately" },
        { num: 3, text: "Communicate openly and honestly" },
        { num: 4, text: "Share responsibilities fairly" },
        { num: 5, text: "Keep noise levels reasonable after 10 PM" },
        { num: 6, text: "Ask before using others' items" },
        { num: 7, text: "Contribute to shared expenses on time" },
        { num: 8, text: "Inform others if bringing guests" },
        { num: 9, text: "Take turns with shared spaces" },
        { num: 10, text: "Be considerate and understanding" }
    ];

    let html = `
        <div class="fade-in" style="padding-bottom: 80px;">
            <h1 style="margin-bottom: var(--space-md); font-size: 1.75rem; font-weight: 800;">House Rules</h1>
            <p style="margin-bottom: var(--space-xl); color: var(--text-secondary); font-size: 0.95rem;">The 10 commandments of our shared space</p>
            
            <div class="card" style="padding: 0; overflow: hidden;">
    `;

    rules.forEach((rule, index) => {
        const isLast = index === rules.length - 1;
        html += `
            <div style="
                display: flex;
                align-items: center;
                gap: var(--space-lg);
                padding: var(--space-lg);
                border-bottom: ${isLast ? 'none' : '1px solid var(--border-subtle)'};
                transition: background var(--transition-fast);
            " class="rule-item">
                <div style="
                    width: 48px;
                    height: 48px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--accent-gradient);
                    border-radius: var(--radius-md);
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: white;
                    box-shadow: var(--shadow-glow);
                ">
                    ${rule.num}
                </div>
                <p style="
                    margin: 0;
                    font-size: 1rem;
                    line-height: 1.6;
                    color: var(--text-primary);
                    font-weight: 500;
                ">
                    ${rule.text}
                </p>
            </div>
        `;
    });

    html += `
            </div>
            
            <div style="
                margin-top: var(--space-xl);
                padding: var(--space-lg);
                background: var(--bg-elevated);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-lg);
                text-align: center;
            ">
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                    💡 <strong>Remember:</strong> These rules help us live harmoniously together
                </p>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Add hover effect
    const style = document.createElement('style');
    style.textContent = `
        .rule-item:hover {
            background: var(--bg-elevated) !important;
        }
    `;
    document.head.appendChild(style);
}
