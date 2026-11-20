
/*
 * TT Ventures - Protect customer pages.
 * Redirect visitors who are not signed in to account.html.
 */
(async function protectCustomerPages() {
    const protectedPages = [
        "index.html",
        "shop.html",
        "contact.html",
        "delivery.html",
        "returns.html"
    ];

    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    if (!protectedPages.includes(currentPage)) {
        return;
    }

    try {
        const response = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            window.location.replace("/account.html");
            return;
        }

        const data = await response.json();
        const customer = data.customer || data.user || data.profile;

        if (!customer || (!customer.name && !customer.email)) {
            window.location.replace("/account.html");
        }
    } catch (error) {
        window.location.replace("/account.html");
    }
})();
