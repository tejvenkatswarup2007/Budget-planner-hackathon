const currentEmail = (localStorage.getItem("currentUserEmail") || "").toLowerCase();
const users = JSON.parse(localStorage.getItem("budgetUsers") || "[]");
const currentAccount = users.find(user => user.email.toLowerCase() === currentEmail);

if (!currentAccount) {
    window.location.replace("index.html");
}

const storageKey = suffix => `${suffix}:${currentEmail}`;

let transactions = JSON.parse(localStorage.getItem(storageKey("transactions")) || "null");

if (transactions === null) {
    const legacyUser = JSON.parse(localStorage.getItem("budgetUser") || "null");
    const legacyTransactions = JSON.parse(localStorage.getItem("transactions") || "[]");

    transactions = legacyUser && legacyUser.email.toLowerCase() === currentEmail
        ? legacyTransactions.map(item => ({ ...item, date: normalizeDate(item.date) }))
        : [];

    localStorage.setItem(storageKey("transactions"), JSON.stringify(transactions));
}

let savingsGoal = Number(localStorage.getItem(storageKey("savingsGoal")) || 0);

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("user-name").textContent = currentAccount.name;
    document.getElementById("chart-month").value = new Date().toISOString().slice(0, 7);

    document.getElementById("chart-month").addEventListener("change", updateChart);
    document.getElementById("chart-type").addEventListener("change", updateChart);
    document.getElementById("current-date").textContent =
        new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

    document.getElementById("transaction-form").addEventListener("submit", addTransaction);
    document.getElementById("goal-form").addEventListener("submit", setGoal);

    updateDashboard();
    displayTransactions();
});

function normalizeDate(value) {
    if (!value) return new Date().toISOString().slice(0, 10);

    const iso = String(value).match(/^\d{4}-\d{2}-\d{2}/);
    if (iso) return iso[0];

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime())
        ? new Date().toISOString().slice(0, 10)
        : parsed.toISOString().slice(0, 10);
}

function saveTransactions() {
    localStorage.setItem(storageKey("transactions"), JSON.stringify(transactions));
}

function money(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function addTransaction(event) {
    event.preventDefault();

    const name = document.getElementById("transaction-name").value.trim();
    const amount = Number(document.getElementById("transaction-amount").value);

    if (!name || !Number.isFinite(amount) || amount <= 0) {
        alert("Enter a name and a valid amount.");
        return;
    }

    transactions.push({
        id: Date.now(),
        name,
        amount,
        type: document.getElementById("transaction-type").value,
        category: document.getElementById("transaction-category").value,
        date: new Date().toISOString().slice(0, 10)
    });

    saveTransactions();
    event.target.reset();
    updateDashboard();
    displayTransactions();
}

function calculateTotals(items = transactions) {
    const income =
        Number(currentAccount.salary || 0) +
        items
            .filter(transaction => transaction.type === "income")
            .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const expense = items
        .filter(transaction => transaction.type === "expense")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    return { income, expense, balance: income - expense };
}

function updateDashboard() {
    const totals = calculateTotals();
    const thisMonth = new Date().toISOString().slice(0, 7);

    const monthTransactions = transactions.filter(transaction =>
        normalizeDate(transaction.date).slice(0, 7) === thisMonth
    );

    const monthTotals = calculateTotals(monthTransactions);

    document.getElementById("total-income").textContent = money(totals.income);
    document.getElementById("total-expense").textContent = money(totals.expense);
    document.getElementById("balance").textContent = money(totals.balance);
    document.getElementById("goal-display").textContent = money(savingsGoal);

    document.getElementById("monthly-income").textContent = money(monthTotals.income);
    document.getElementById("monthly-expense").textContent = money(monthTotals.expense);
    document.getElementById("monthly-savings").textContent =
        money(Math.max(monthTotals.balance, 0));
    document.getElementById("transaction-count").textContent = monthTransactions.length;

    updateSavingsProgress();
    updateChart();
    updateBudgetAlert();
}

function displayTransactions() {
    const list = document.getElementById("transactions-list");

    if (!transactions.length) {
        list.innerHTML =
            '<div class="empty-state"><p>No transactions yet.</p><span>Add your first transaction above.</span></div>';
        return;
    }

    list.replaceChildren();

    [...transactions].reverse().forEach(transaction => {
        const item = document.createElement("div");
        item.className = "transaction-item";

        const detail = document.createElement("div");

        const name = document.createElement("div");
        name.className = "transaction-name";
        name.textContent = transaction.name;

        const category = document.createElement("div");
        category.className = "transaction-category";
        category.textContent =
            `${transaction.category} • ${normalizeDate(transaction.date)}`;

        detail.append(name, category);

        const value = document.createElement("div");
        value.className =
            transaction.type === "income" ? "income-text" : "expense-text";
        value.textContent =
            `${transaction.type === "income" ? "+" : "−"} ${money(transaction.amount)}`;

        item.append(detail, value);
        list.appendChild(item);
    });
}

function setGoal(event) {
    event.preventDefault();

    savingsGoal = Number(document.getElementById("goal-amount").value);

    if (!Number.isFinite(savingsGoal) || savingsGoal <= 0) {
        alert("Enter a valid savings goal.");
        return;
    }

    localStorage.setItem(storageKey("savingsGoal"), String(savingsGoal));
    event.target.reset();
    updateDashboard();
}

function updateSavingsProgress() {
    const savings = Math.max(calculateTotals().balance, 0);
    const percentage = savingsGoal
        ? Math.min((savings / savingsGoal) * 100, 100)
        : 0;

    document.getElementById("progress-percentage").textContent =
        `${Math.round(percentage)}%`;
    document.getElementById("progress-fill").style.width = `${percentage}%`;

    document.getElementById("progress-text").textContent = savingsGoal
        ? `${money(savings)} saved out of ${money(savingsGoal)}`
        : "Set a savings goal to start tracking.";
}

const chartColors = [
    "#0077cc", "#159447", "#e39b00", "#d93025", "#8e44ad",
    "#16a085", "#e67e22", "#34495e", "#c0392b"
];

function updateChart() {
    const canvas = document.getElementById("expense-chart");
    const context = canvas.getContext("2d");
    const legend = document.getElementById("chart-legend");
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.max(320, rect.width) * pixelRatio;
    canvas.height = 300 * pixelRatio;
    context.scale(pixelRatio, pixelRatio);

    const width = canvas.width / pixelRatio;
    const height = 300;

    context.clearRect(0, 0, width, height);

    const month =
        document.getElementById("chart-month").value ||
        new Date().toISOString().slice(0, 7);

    const expenses = transactions.filter(transaction =>
        transaction.type === "expense" &&
        normalizeDate(transaction.date).slice(0, 7) === month
    );

    const categories = {};

    expenses.forEach(transaction => {
        categories[transaction.category] =
            (categories[transaction.category] || 0) + Number(transaction.amount);
    });

    const entries = Object.entries(categories);
    legend.replaceChildren();

    if (!entries.length) {
        context.fillStyle = "#777";
        context.font = "14px Arial";
        context.textAlign = "center";
        context.fillText("No expenses recorded for this month", width / 2, height / 2);
        return;
    }

    const chartType = document.getElementById("chart-type").value;

    if (chartType === "pie") drawPie(context, entries, width, height);
    if (chartType === "bar") drawBars(context, entries, width, height);
    if (chartType === "scatter") drawScatter(context, expenses, width, height);

    entries.forEach(([category, amount], index) => {
        const item = document.createElement("div");
        item.className = "legend-item";

        const swatch = document.createElement("span");
        swatch.className = "legend-color";
        swatch.style.background = chartColors[index % chartColors.length];

        const label = document.createElement("span");
        label.textContent = `${category}: ${money(amount)}`;

        item.append(swatch, label);
        legend.appendChild(item);
    });
}

function drawPie(context, entries, width, height) {
    const total = entries.reduce((sum, entry) => sum + entry[1], 0);
    let angle = -Math.PI / 2;
    const radius = Math.min(width, height) * 0.34;

    entries.forEach(([, amount], index) => {
        const nextAngle = angle + (amount / total) * Math.PI * 2;

        context.beginPath();
        context.moveTo(width / 2, height / 2);
        context.arc(width / 2, height / 2, radius, angle, nextAngle);
        context.closePath();
        context.fillStyle = chartColors[index % chartColors.length];
        context.fill();

        angle = nextAngle;
    });
}

function drawBars(context, entries, width, height) {
    const padding = { left: 52, right: 16, top: 20, bottom: 48 };
    const maxAmount = Math.max(...entries.map(entry => entry[1]));

    context.strokeStyle = "#d9e1e8";
    context.beginPath();
    context.moveTo(padding.left, padding.top);
    context.lineTo(padding.left, height - padding.bottom);
    context.lineTo(width - padding.right, height - padding.bottom);
    context.stroke();

    const slotWidth =
        (width - padding.left - padding.right) / entries.length;
    const barWidth = Math.min(48, slotWidth * 0.62);

    entries.forEach(([label, amount], index) => {
        const barHeight =
            (height - padding.top - padding.bottom) * amount / maxAmount;
        const x =
            padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
        const y = height - padding.bottom - barHeight;

        context.fillStyle = chartColors[index % chartColors.length];
        context.fillRect(x, y, barWidth, barHeight);

        context.fillStyle = "#333";
        context.font = "11px Arial";
        context.textAlign = "center";
        context.fillText(label.slice(0, 10), x + barWidth / 2, height - 25);
        context.fillText(money(amount), x + barWidth / 2, Math.max(13, y - 5));
    });
}

function drawScatter(context, expenses, width, height) {
    const padding = { left: 44, right: 18, top: 20, bottom: 42 };
    const maxAmount = Math.max(...expenses.map(transaction => Number(transaction.amount)));

    context.strokeStyle = "#d9e1e8";
    context.beginPath();
    context.moveTo(padding.left, padding.top);
    context.lineTo(padding.left, height - padding.bottom);
    context.lineTo(width - padding.right, height - padding.bottom);
    context.stroke();

    context.fillStyle = "#666";
    context.font = "11px Arial";
    context.textAlign = "center";
    context.fillText("Day of month", width / 2, height - 10);

    expenses.forEach((transaction, index) => {
        const day = Number(normalizeDate(transaction.date).slice(8, 10));
        const x =
            padding.left + ((day - 1) / 30) * (width - padding.left - padding.right);
        const y =
            height - padding.bottom -
            (Number(transaction.amount) / maxAmount) *
                (height - padding.top - padding.bottom);

        context.beginPath();
        context.arc(x, y, 5, 0, Math.PI * 2);
        context.fillStyle = chartColors[index % chartColors.length];
        context.fill();
    });

    context.textAlign = "left";
    context.fillStyle = "#666";
    context.fillText("Expense amount →", padding.left, height - padding.bottom + 26);
}

function updateBudgetAlert() {
    const totals = calculateTotals();
    const box = document.getElementById("budget-alert");

    box.className =
        totals.balance < 0 ? "alert-content warning" : "alert-content";

    box.innerHTML = `
        <div class="alert-icon">${totals.balance < 0 ? "⚠️" : "✅"}</div>
        <div>
            <h3>${totals.balance < 0 ? "Overspending alert" : "Budget is under control"}</h3>
            <p>${totals.balance < 0
                ? "Your expenses are higher than your income."
                : "You still have money available to manage."}</p>
        </div>
    `;
}

function logout() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUserEmail");
    window.location.href = "index.html";
}

window.addEventListener("resize", updateChart);