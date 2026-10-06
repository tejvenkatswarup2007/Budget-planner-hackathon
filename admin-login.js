/*
    DEMO PROJECT ADMIN CREDENTIALS

    Admin ID:
    admin

    Password:
    Admin@123
*/

const ADMIN_ID = "admin";

const ADMIN_PASSWORD = "Admin@123";


document
    .getElementById("admin-login-form")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const id =
                document
                    .getElementById("admin-id")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("admin-password")
                    .value;


            if (
                id === ADMIN_ID &&
                password === ADMIN_PASSWORD
            ) {

                localStorage.setItem(
                    "adminAuthenticated",
                    "true"
                );


                window.location.href =
                    "admin.html";

                return;

            }


            alert(
                "Invalid Admin ID or password."
            );

        }
    );