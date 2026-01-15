document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expense-form');
    const themeToggle = document.getElementById('theme-toggle');
    const expensesDiv = document.getElementById('expenses');
    const expenseChartCtx = document.getElementById('expenseChart').getContext('2d');
    const totalBalanceEl = document.getElementById('total-balance');
    const monthTotalEl = document.getElementById('month-total');

    let expenses = JSON.parse(localStorage.getItem('expenses')) || {};
    let chart;
    let isDarkMode = localStorage.getItem('theme') === 'dark';

    // Initialize UI
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    setupChart();
    updateUI();

    expenseForm.addEventListener('submit', addExpense);
    themeToggle.addEventListener('click', toggleTheme);

    function addExpense(e) {
        e.preventDefault();

        const date = document.getElementById('date').value;
        const description = document.getElementById('description').value;
        const category = document.getElementById('category').value;
        const amount = parseFloat(document.getElementById('amount').value);

        if (!date || !description || isNaN(amount)) return;

        if (!expenses[date]) {
            expenses[date] = [];
        }

        expenses[date].push({ description, category, amount });
        saveData();
        updateUI();
        expenseForm.reset();
    }

    function updateUI() {
        displayExpenses();
        updateStats();
        updateChart();
    }

    function saveData() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }

    function updateStats() {
        let total = 0;
        let monthTotal = 0;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        Object.keys(expenses).forEach(dateStr => {
            const date = new Date(dateStr);
            const dayTotal = expenses[dateStr].reduce((sum, exp) => sum + exp.amount, 0);
            total += dayTotal;

            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                monthTotal += dayTotal;
            }
        });

        totalBalanceEl.textContent = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        monthTotalEl.textContent = `₹${monthTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }

    function displayExpenses() {
        expensesDiv.innerHTML = '';

        // Sort dates in descending order (newest first)
        const sortedDates = Object.keys(expenses).sort((a, b) => new Date(b) - new Date(a));

        sortedDates.forEach(date => {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('expense-day');

            const dateObj = new Date(date);
            const dayHeader = document.createElement('h2');
            dayHeader.textContent = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            dayDiv.appendChild(dayHeader);

            expenses[date].forEach((expense, index) => {
                const item = document.createElement('div');
                item.classList.add('expense-item');
                
                item.innerHTML = `
                    <div class="expense-info">
                        <span class="expense-desc">${expense.description}</span>
                        <span class="expense-category">${expense.category}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1.5rem;">
                        <span class="expense-amount">₹${expense.amount.toLocaleString('en-IN')}</span>
                        <div class="actions">
                            <button class="btn-icon edit" onclick="editExpense('${date}', ${index})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete" onclick="deleteExpense('${date}', ${index})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                dayDiv.appendChild(item);
            });

            expensesDiv.appendChild(dayDiv);
        });
    }

    // Expose functions to window for onclick handlers
    window.editExpense = (date, index) => {
        const expense = expenses[date][index];
        document.getElementById('date').value = date;
        document.getElementById('description').value = expense.description;
        document.getElementById('category').value = expense.category;
        document.getElementById('amount').value = expense.amount;
        
        deleteExpense(date, index);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.deleteExpense = (date, index) => {
        expenses[date].splice(index, 1);
        if (expenses[date].length === 0) {
            delete expenses[date];
        }
        saveData();
        updateUI();
    };

    function setupChart() {
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#e0e0e0' : '#333';

        chart = new Chart(expenseChartCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Daily Spending',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: isDark ? '#1e1e2e' : '#fff',
                        titleColor: isDark ? '#fff' : '#000',
                        bodyColor: isDark ? '#ccc' : '#444',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                        ticks: {
                            color: textColor,
                            callback: value => '₹' + value
                        }
                    }
                }
            }
        });
    }

    function updateChart() {
        const sortedDates = Object.keys(expenses).sort();
        const labels = sortedDates.map(d => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        const data = sortedDates.map(date => expenses[date].reduce((sum, exp) => sum + exp.amount, 0));

        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#e0e0e0' : '#333';
        chart.options.scales.x.ticks.color = textColor;
        chart.options.scales.y.ticks.color = textColor;
        
        chart.update();
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        
        updateChart();
    }
});
