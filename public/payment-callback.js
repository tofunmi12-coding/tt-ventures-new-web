const heading = document.getElementById("heading");
    const message = document.getElementById("message");
    const icon = document.getElementById("status-icon");
    const orderReference = document.getElementById("order-reference");
    const homeLink = document.getElementById("home-link");

    async function verifyPayment() {
      const params = new URLSearchParams(window.location.search);
      const reference =
        params.get("reference") || params.get("trxref");

      if (!reference) {
        throw new Error("No payment reference was provided.");
      }

      const response = await fetch(
        "/api/payments/verify?reference=" +
        encodeURIComponent(reference),
        { method: "GET", credentials: "same-origin" }
      );

      const result = await response.json();

      if (!response.ok || result.paymentStatus !== "paid") {
        throw new Error(
          result.error ||
          "Payment has not been confirmed yet. Your cart has been kept."
        );
      }

      // Clear the cart only after the server confirms payment.
      localStorage.removeItem("tt-ventures-cart");

      icon.textContent = "\u2705";
      heading.textContent = "Payment successful!";
      message.textContent =
        "Thank you for shopping with TT Ventures. Your payment has been verified.";
      orderReference.textContent =
        "Order reference: " + (result.orderId || "Confirmed");
      homeLink.hidden = false;
    }

    verifyPayment().catch((error) => {
      icon.textContent = "\u26A0\uFE0F";
      heading.textContent = "Payment not confirmed";
      message.textContent =
        error.message +
        " If you completed payment, please contact us before paying again.";
      homeLink.hidden = false;
    });
