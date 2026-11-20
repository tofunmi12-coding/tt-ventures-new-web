(() => {
    "use strict";

    let overlay = null;
    let previousFocus = null;

    function closeAuthModal() {
        if (!overlay) return;

        overlay.remove();
        overlay = null;
        document.body.style.overflow = "";

        if (previousFocus && document.contains(previousFocus)) {
            previousFocus.focus();
        }
    }

    function openAuthModal() {
        if (overlay) return;

        previousFocus = document.activeElement;

        overlay = document.createElement("div");
        overlay.className = "tt-auth-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", "Sign in or create a TT Ventures account");

        const panel = document.createElement("div");
        panel.className = "tt-auth-panel";

        const topbar = document.createElement("div");
        topbar.className = "tt-auth-topbar";

        const title = document.createElement("span");
        title.textContent = "YOUR TT VENTURES ACCOUNT";

        const close = document.createElement("button");
        close.type = "button";
        close.className = "tt-auth-close";
        close.setAttribute("aria-label", "Close sign-in window");
        close.textContent = "\u00D7";
        close.addEventListener("click", closeAuthModal);

        const frame = document.createElement("iframe");
        frame.className = "tt-auth-frame";
        frame.title = "TT Ventures sign in and registration";
        frame.src = "account.html?auth=modal";

        topbar.append(title, close);
        panel.append(topbar, frame);
        overlay.append(panel);

        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) closeAuthModal();
        });

        document.body.append(overlay);
        document.body.style.overflow = "hidden";
        close.focus();
    }

    document.addEventListener("click", (event) => {
        const link = event.target.closest('a[href]');
        if (!link) return;

        const url = new URL(link.href, window.location.href);

        if (
            url.origin === window.location.origin &&
            url.pathname.endsWith("/account.html") &&
            !url.searchParams.has("auth")
        ) {
            event.preventDefault();
            openAuthModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && overlay) closeAuthModal();
    });

    window.addEventListener("message", (event) => {
        if (event.origin !== window.location.origin) return;

        if (event.data && event.data.type === "tt-auth-success") {
            closeAuthModal();
        }
    });
})();
