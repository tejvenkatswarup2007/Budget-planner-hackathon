/* =========================
   ADMIN SECURITY CHECK
========================= */

function requireAdmin() {

    if (
        localStorage.getItem(
            "adminAuthenticated"
        ) !== "true"
    ) {

        window.location.replace(
            "admin-login.html"
        );

        return false;
    }

    return true;
}


/* =========================
   LOAD ADMIN DATA
========================= */

function loadAdminData() {

    if (!requireAdmin()) {
        return;
    }


    const users =
        JSON.parse(
            localStorage.getItem(
                "budgetUsers"
            ) || "[]"
        );


    const allTransactions = [];


    let totalIncome = 0;

    let totalExpenses = 0;


    users.forEach(user => {

        const email =
            user.email.toLowerCase();


        const transactions =
            JSON.parse(
                localStorage.getItem(
                    `transactions:${email}`
                ) || "[]"
            );


        const goal =
            Number(
                localStorage.getItem(
                    `savingsGoal:${email}`
                ) || 0
            );


        const salary =
            Number(user.salary || 0);


        const transactionIncome =
            transactions
                .filter(
                    t => t.type === "income"
                )
                .reduce(
                    (sum, t) =>
                        sum +
                        Number(t.amount || 0),
                    0
                );


        const expenses =
            transactions
                .filter(
                    t => t.type === "expense"
                )
                .reduce(
                    (sum, t) =>
                        sum +
                        Number(t.amount || 0),
                    0
                );


        const income =
            salary +
            transactionIncome;


        const balance =
            income -
            expenses;


        totalIncome += income;

        totalExpenses += expenses;


        /*
            Attach customer name to
            every transaction
        */

        allTransactions.push(

            ...transactions.map(t => ({

                ...t,

                user: user.name,

                email: email

            }))

        );


        /*
            Customer-specific analysis
        */

        user._analysis = {

            income: income,

            expenses: expenses,

            balance: balance,

            goal: goal,

            count: transactions.length

        };

    });


    document
        .getElementById("userCount")
        .textContent = users.length;


    document
        .getElementById("totalIncome")
        .textContent =
            money(totalIncome);


    document
        .getElementById("totalExpense")
        .textContent =
            money(totalExpenses);


    document
        .getElementById("transactionCount")
        .textContent =
            allTransactions.length;


    displayUsers(users);

    displayTransactions(
        allTransactions
    );

}


/* =========================
   MONEY FORMAT
========================= */

function money(amount) {

    return "₹" +
        Number(amount || 0)
            .toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 2
                }
            );

}


/* =========================
   CUSTOMER TABLE
========================= */

function displayUsers(users) {

    const table =
        document.getElementById(
            "userTable"
        );


    table.replaceChildren();


    if (!users.length) {

        const row =
            table.insertRow();


        const cell =
            row.insertCell();


        cell.colSpan = 8;

        cell.textContent =
            "No customers registered yet.";

        return;

    }


    users.forEach(
        (user, index) => {

            const analysis =
                user._analysis || {};


            const row =
                table.insertRow();


            row.insertCell()
                .textContent =
                    user.name ||
                    "User";


            row.insertCell()
                .textContent =
                    user.email ||
                    "-";


            row.insertCell()
                .textContent =
                    money(
                        user.salary
                    );


            row.insertCell()
                .textContent =
                    money(
                        analysis.expenses
                    );


            row.insertCell()
                .textContent =
                    money(
                        analysis.balance
                    );


            row.insertCell()
                .textContent =
                    money(
                        analysis.goal
                    );


            row.insertCell()
                .textContent =
                    analysis.count ||
                    0;


            const actionCell =
                row.insertCell();


            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "delete-btn";


            button.textContent =
                "Delete";


            button.addEventListener(
                "click",
                () => deleteUser(index)
            );


            actionCell.appendChild(
                button
            );

        }
    );

}


/* =========================
   DELETE CUSTOMER
========================= */

function deleteUser(index) {

    const users =
        JSON.parse(
            localStorage.getItem(
                "budgetUsers"
            ) || "[]"
        );


    const user =
        users[index];


    if (!user) {
        return;
    }


    if (
        !confirm(
            `Delete ${user.name}'s account and all saved budget data?`
        )
    ) {

        return;

    }


    const email =
        user.email.toLowerCase();


    localStorage.removeItem(
        `transactions:${email}`
    );


    localStorage.removeItem(
        `savingsGoal:${email}`
    );


    users.splice(
        index,
        1
    );


    localStorage.setItem(
        "budgetUsers",
        JSON.stringify(users)
    );


    loadAdminData();

}


/* =========================
   TRANSACTION TABLE
========================= */

function displayTransactions(
    transactions
) {

    const table =
        document.getElementById(
            "transactionTable"
        );


    table.replaceChildren();


    transactions
        .slice(-100)
        .reverse()
        .forEach(transaction => {

            const row =
                table.insertRow();


            [

                transaction.user ||
                    "-",

                transaction.date ||
                    "-",

                transaction.type ||
                    "-",

                money(
                    transaction.amount
                ),

                transaction.category ||
                    "-",

                transaction.name ||
                    "-"

            ].forEach(value => {

                row.insertCell()
                    .textContent =
                        value;

            });

        });

}


/* =========================
   ADMIN LOGOUT
========================= */

function logout() {

    localStorage.removeItem(
        "adminAuthenticated"
    );


    window.location.href =
        "index.html";

}


/* =========================
   START
========================= */

loadAdminData();