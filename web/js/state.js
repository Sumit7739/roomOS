// Global State Management
const state = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    group: JSON.parse(localStorage.getItem('group') || 'null')
};

export function getState() {
    return state;
}

export function updateState(key, value) {
    state[key] = value;
    if (value === null) {
        localStorage.removeItem(key);
    } else {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
}
