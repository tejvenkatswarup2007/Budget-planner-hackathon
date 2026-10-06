const USERS_KEY = "budgetUsers";


function readUsers() {

    return JSON.parse(
        localStorage.getItem(USERS_KEY) || "[]"
    );

}


/* =========================
   OLD USER MIGRATION
========================= */

function migrateLegacyUser() {

    const users = readUsers();

    const legacy =
        JSON.parse(
            localStorage.getItem("budgetUser") || "null"
        );


    if (
        legacy &&
        legacy.email &&
        !users.some(
            user =>
                user.email.toLowerCase() ===
                legacy.email.toLowerCase()
        )
    ) {

        users.push({
            ...legacy,
            salary: Number(legacy.salary) || 0
        });

        localStorage.setItem(
            USERS_KEY,
            JSON.stringify(users)
        );

    }

    return users;

}


/* =========================
   CUSTOMER LOGIN
========================= */

document
    .getElementById("login-form")
    .addEventListener("submit", function(event) {

        event.preventDefault();


        const email =
            document
                .getElementById("login-email")
                .value
                .trim()
                .toLowerCase();


        const password =
            document
                .getElementById("login-password")
                .value;


        const users =
            migrateLegacyUser();


        const user =
            users.find(
                item =>
                    item.email.toLowerCase() === email &&
                    item.password === password
            );


        if (!user) {

            alert(
                "Invalid email or password. Please register if you are new."
            );

            return;

        }


        /* Store logged-in customer */

        localStorage.setItem(
            "currentUserEmail",
            user.email.toLowerCase()
        );

        localStorage.setItem(
            "currentUser",
            user.name
        );


        /* Open that customer's dashboard */

        window.location.href =
            "dashboard.html";

    });


/* =========================
   CUSTOMER REGISTRATION
========================= */

document
    .getElementById("register-form")
    .addEventListener("submit", function(event) {

        event.preventDefault();


        const name =
            document
                .getElementById("register-name")
                .value
                .trim();


        const salary =
            Number(
                document
                    .getElementById("register-salary")
                    .value
            );


        const email =
            document
                .getElementById("register-email")
                .value
                .trim()
                .toLowerCase();


        const password =
            document
                .getElementById("register-password")
                .value;


        /* Validation */

        if (
            !name ||
            !email ||
            !password ||
            !Number.isFinite(salary) ||
            salary <= 0
        ) {

            alert(
                "Please enter your name, monthly salary/income, email and password."
            );

            return;

        }


        if (password.length < 6) {

            alert(
                "Password must be at least 6 characters."
            );

            return;

        }


        const users =
            migrateLegacyUser();


        /* Check duplicate email */

        if (
            users.some(
                user =>
                    user.email.toLowerCase() === email
            )
        ) {

            alert(
                "An account with this email already exists. Please log in."
            );

            return;

        }


        /* Create customer */

        const user = {

            name: name,

            email: email,

            password: password,

            salary: salary

        };


        users.push(user);


        localStorage.setItem(
            USERS_KEY,
            JSON.stringify(users)
        );


        /* Give the new user completely separate data */

        localStorage.setItem(
            `transactions:${email}`,
            JSON.stringify([])
        );


        localStorage.setItem(
            `savingsGoal:${email}`,
            "0"
        );


        /* Login newly registered user */

        localStorage.setItem(
            "currentUserEmail",
            email
        );

        localStorage.setItem(
            "currentUser",
            name
        );


        /* Go to customer dashboard */

        window.location.href =
            "dashboard.html";

    });