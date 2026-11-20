
/*
 * TT Ventures - Customer Accounts
 * Requires these backend routes:
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/me
 * POST /api/auth/logout
 */

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginTab = document.getElementById("show-login");
const registerTab = document.getElementById("show-register");
const accountProfile = document.getElementById("section-my-account");
const accountMessage = document.getElementById("account-message");
const profileMessage = document.getElementById("profile-message");
const logoutButton = document.getElementById("logout-button");
const signinButton = document.getElementById("signin-button");
const accountNavItems = document.querySelectorAll(".account-nav-item");
const accountSections = document.querySelectorAll(".account-section");
const wishlistMessage = document.getElementById("wishlist-message");
const wishlistList = document.getElementById("wishlist-list");

// Display success and error messages.
function showMessage(message, isError = false) {
    if (!accountMessage) return;

    accountMessage.textContent = message;
    accountMessage.style.color = isError ? "#b42318" : "#287a3d";
}

// Display the sign-in form.
function showLogin() {
    loginForm.hidden = false;
    registerForm.hidden = true;
    accountProfile.hidden = true;

    loginTab.hidden = false;
    registerTab.hidden = false;

    loginTab.classList.add("active");
    registerTab.classList.remove("active");

    // Show the orange Sign In button, hide account sections
    if (signinButton) signinButton.hidden = true;
    accountSections.forEach(section => {
        section.classList.remove("active");
        section.classList.add("hidden");
    });

    showMessage("");
}

// Display the registration form.
function showRegister() {
    loginForm.hidden = true;
    registerForm.hidden = false;
    accountProfile.hidden = true;

    loginTab.hidden = false;
    registerTab.hidden = false;

    loginTab.classList.remove("active");
    registerTab.classList.add("active");

    showMessage("");
}

// Display the signed-in customer's profile.

function showProfile(customer) {
    if (!customer || (!customer.name && !customer.email)) {
        showMessage(
            "Your account was found, but customer details are missing.",
            true
        );
        return;
    }

    loginForm.hidden = true;
    registerForm.hidden = true;
    loginTab.hidden = true;
    registerTab.hidden = true;
    accountProfile.hidden = false;

    // Hide the orange Sign In button, show My Account section
    if (signinButton) signinButton.hidden = true;
    showSection("my-account");

    profileMessage.textContent =
        `Welcome, ${customer.name || customer.email}!`;

    showMessage("");

    // Load the signed-in customer's order history.
    loadCustomerOrderHistory();

    // Load the signed-in customer's wishlist.
    loadWishlist();
}

// Support common backend response formats.
function getCustomer(data) {
    if (!data || typeof data !== "object") {
        return null;
    }

    if (data.customer && typeof data.customer === "object") {
        return data.customer;
    }

    if (data.user && typeof data.user === "object") {
        return data.user;
    }

    if (data.profile && typeof data.profile === "object") {
        return data.profile;
    }

    return null;
}

// Send requests to the backend.
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
        headers: {
            ...(options.headers || {}),
            "Content-Type": "application/json"
        }
    });

    const contentType = response.headers.get("content-type") || "";
    let data = {};

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        const text = await response.text();

        if (text) {
            data.message = text;
        }
    }

    if (!response.ok) {
        const error = new Error(
            data.message ||
            data.error ||
            `Request failed (HTTP ${response.status}).`
        );
        error.status = response.status;
        throw error;
    }

    return data;
}

// Retrieve the signed-in customer from the server session.
async function getCurrentCustomer() {
    try {
        const data = await apiRequest("/api/auth/me");
        return getCustomer(data);
    } catch (error) {
        if (error.status === 401) return null;
        throw error;
    }
}

// Switch between sign-in and registration.
loginTab.addEventListener("click", showLogin);
registerTab.addEventListener("click", showRegister);

// Customer sign-in.
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("Signing you in...");

    const formData = new FormData(loginForm);

    try {
        const data = await apiRequest("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: formData.get("email"),
                password: formData.get("password")
            })
        });

        let customer = getCustomer(data);

        // Retrieve the profile if login did not return customer details.
        if (!customer) {
            customer = await getCurrentCustomer();
        }

        if (!customer) {
            throw new Error(
                "Login was accepted, but customer details were not returned. " +
                "Check the /api/auth/me route in server.js."
            );
        }

        loginForm.reset();
        if (new URLSearchParams(window.location.search).get("auth") === "modal") {
            window.parent.postMessage({ type: "tt-auth-success" }, window.location.origin);
        } else {
            window.location.href = "/";
        }
    } catch (error) {
        showMessage(error.message || "Unable to sign in.", true);
    }
});

// Customer registration.
registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("Creating your account...");

    const formData = new FormData(registerForm);

    try {
        const data = await apiRequest("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({
                name: formData.get("name"),
                email: formData.get("email"),
                password: formData.get("password")
            })
        });

        registerForm.reset();

        // Some backends sign customers in automatically after registration.
        let customer = getCustomer(data);

        if (!customer) {
            try {
                customer = await getCurrentCustomer();
            } catch {
                customer = null;
            }
        }

        if (customer) {
            if (new URLSearchParams(window.location.search).get("auth") === "modal") {
                window.parent.postMessage({ type: "tt-auth-success" }, window.location.origin);
            } else {
                window.location.href = "/";
            }
        } else {
            showLogin();

            showMessage(
                data.message ||
                "Account created. Please sign in using your new account."
            );
        }
    } catch (error) {
        showMessage(
            error.message || "Unable to create your account.",
            true
        );
    }
});

// Customer sign-out.
logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    showMessage("Signing you out...");

    try {
        await apiRequest("/api/auth/logout", {
            method: "POST",
            body: JSON.stringify({})
        });

        showLogin();
        showMessage("You have signed out.");
    } catch (error) {
        showMessage(error.message || "Unable to sign out.", true);
    } finally {
        logoutButton.disabled = false;
    }
});

// Orange Sign In button click â†’ show sign-in form.
if (signinButton) {
    signinButton.addEventListener("click", () => {
        showLogin();
    });
}

// Account navigation item clicks â†’ switch sections.
accountNavItems.forEach(item => {
    item.addEventListener("click", (event) => {
        event.preventDefault();
        const sectionId = item.dataset.section;
        if (sectionId) {
            showSection(sectionId);
        }
    });
});






// Switch between account sections (My Account, Orders, Wishlist).
function showSection(sectionId) {
    accountSections.forEach(section => {
        section.classList.remove("active");
        section.classList.add("hidden");
    });

    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("active");
    }

    // Update nav item active states
    accountNavItems.forEach(item => {
        if (item.dataset.section === sectionId) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
}

// Load the signed-in customer's wishlist.
async function loadWishlist() {
    if (!wishlistMessage || !wishlistList) return;

    try {
        const response = await fetch("/api/my-wishlist", {
            method: "GET",
            credentials: "same-origin",
            headers: { "Accept": "application/json" }
        });

        const items = await response.json();

        if (!response.ok) {
            throw new Error(items.error || "Could not load your wishlist.");
        }

        wishlistList.replaceChildren();

        if (!Array.isArray(items) || items.length === 0) {
            wishlistList.innerHTML = `
                <p class="wishlist-empty">Your wishlist is empty.</p>
                <p class="wishlist-hint">Sign in to save your favorite items.</p>
            `;
            return;
        }

        wishlistMessage.textContent = "";

        items.forEach(item => {
            const card = document.createElement("article");
            card.className = "wishlist-item";
            card.innerHTML = `
                <img src="${item.image || ''}" alt="${item.name}" class="wishlist-item-image">
                <div class="wishlist-item-info">
                    <h3>${item.name}</h3>
                    <p class="wishlist-item-price">${item.price ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(item.price) : ""}</p>
                </div>
            `;
            wishlistList.appendChild(card);
        });
    } catch (error) {
        wishlistMessage.textContent = error.message || "Unable to load wishlist.";
    }
}

/* Restore the customer's session when opening My Account. */
async function checkExistingSession() {
    try {
        const customer = await getCurrentCustomer();

        if (customer && (customer.name || customer.email)) {
            showProfile(customer);
        } else {
            showLogin();
        }
    } catch (error) {
        console.error("Could not restore customer session:", error);
        showLogin();
    }
}

checkExistingSession();
;


/* ---------------------------------------------------------
   Customer order history
--------------------------------------------------------- */
async function loadCustomerOrderHistory() {
    const message = document.getElementById("order-history-message");
    const list = document.getElementById("order-history-list");

    if (!message || !list) return;

    try {
        const response = await fetch("/api/my-orders", {
            method: "GET",
            credentials: "same-origin",
            headers: { "Accept": "application/json" }
        });

        const orders = await response.json();

        if (!response.ok) {
            throw new Error(orders.error || "Could not load your orders.");
        }

        list.replaceChildren();

        if (!Array.isArray(orders) || orders.length === 0) {
            message.textContent = "You haven't placed any orders with this account yet.";
            return;
        }

        message.textContent = "";

        const money = new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        });

        orders.forEach(order => {
            const card = document.createElement("article");
            card.className = "order-history-card";

            const heading = document.createElement("h3");
            heading.textContent = `Order ${order.orderId}`;

            const date = document.createElement("p");
            const parsedDate = new Date(order.createdAt);
            date.textContent = `Placed: ${Number.isNaN(parsedDate.getTime())
                ? "Date unavailable"
                : parsedDate.toLocaleString()
                }`;

            const status = document.createElement("p");

            const orderStatus = String(order.status || "Pending").toLowerCase();

            status.className = "order-history-status";
            status.classList.add(
                "status-" + orderStatus.replace(/[^a-z0-9-]/g, "")
            );
            status.textContent = `Status: ${order.status || "Pending"}`;


            const items = document.createElement("ul");

            (Array.isArray(order.items) ? order.items : []).forEach(item => {
                const row = document.createElement("li");
                row.textContent =
                    `${item.name} Ã— ${item.quantity} â€” ${money.format(item.subtotal)}`;
                items.appendChild(row);
            });

            const total = document.createElement("p");
            total.className = "order-history-total";
            total.textContent = `Order total: ${money.format(order.total)}`;

            card.append(heading, date, status, items, total);
            list.appendChild(card);
        });
    } catch (error) {
        message.textContent = error.message || "Unable to load order history.";
    }
}


