const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000/api';

async function request(endpoint, options = {}) {
    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        options
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Something went wrong with the API request.'
        );
    }

    return data;
}

// -----------------------------
// MONTH
// -----------------------------

export async function getActiveMonth() {
    return request('/months/active');
}

export async function getMonthBalance(monthId) {
    return request(`/months/${monthId}/balance`);
}

export async function getMonthSummary(monthId) {
    return request(`/months/${monthId}/summary`);
}

export async function getMonthlyHistory() {
    return request('/months/history');
}

export async function completeMonth(monthId) {
    return request(`/months/${monthId}/complete`, {
        method: 'POST'
    });
}

export async function createNextMonth(
    previousMonthId,
    nextMonth
) {
    return request(`/months/${previousMonthId}/next`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            month: nextMonth
        })
    });
}

// -----------------------------
// TRANSACTIONS
// -----------------------------

export async function getTransactions(monthId) {
    return request(
        `/transactions?month_id=${monthId}`
    );
}

export async function createTransaction(
    transactionData
) {
    return request('/transactions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
    });
}

export async function updateTransaction(
    id,
    transactionData
) {
    return request(`/transactions/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
    });
}

export async function deleteTransaction(id) {
    return request(`/transactions/${id}`, {
        method: 'DELETE'
    });
}

// -----------------------------
// SAVINGS GOALS
// -----------------------------

export async function getGoals() {
    return request('/goals');
}

export async function createGoal(goalData) {
    return request('/goals', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(goalData)
    });
}

export async function updateGoal(
    id,
    goalData
) {
    return request(`/goals/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(goalData)
    });
}

export async function deleteGoal(id) {
    return request(`/goals/${id}`, {
        method: 'DELETE'
    });
}

// -----------------------------
// ANALYTICS
// -----------------------------

export async function getAnalytics() {
    return request('/analytics');
}

// -----------------------------
// EXCEL EXPORT
// -----------------------------

export function getExcelExportUrl() {
    return `${API_BASE_URL}/export/excel`;
}