/* Keep the existing sign-in gate for the migrated App Router pages. */
(async function protectCustomerPages() {
    const protectedPaths = new Set([
        "/", "/shop", "/contact", "/delivery", "/returns",
        "/index.html", "/shop.html", "/contact.html", "/delivery.html", "/returns.html"
    ]);
    if (!protectedPaths.has(window.location.pathname)) return;
    try {
        const response = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "same-origin",
            headers: { "Accept": "application/json" }
        });
        if (!response.ok) {
            window.location.replace("/account");
            return;
        }
        const data = await response.json();
        const customer = data.customer || data.user || data.profile;
        if (!customer || (!customer.name && !customer.email)) window.location.replace("/account");
    } catch {
        window.location.replace("/account");
    }
})();
