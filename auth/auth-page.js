(function () {
    "use strict";

    var params = new URLSearchParams(window.location.search);

    if (params.get("auth") !== "modal") {
        window.location.replace("index.html");
        return;
    }

    document.documentElement.classList.add("auth-modal-page");
})();
