/* TT Ventures admin dashboard. Credentials are kept in memory only. */
(() => {
  "use strict";

  const form = document.getElementById("admin-login-form");
  const usernameInput = document.getElementById("admin-username");
  const passwordInput = document.getElementById("admin-password");
  const message = document.getElementById("admin-message");
  const ordersSection = document.getElementById("orders-section");
  const ordersList = document.getElementById("orders-list");
  const refreshButton = document.getElementById("refresh-orders");
  const loginButton = document.getElementById("admin-login-button");
  const year = document.getElementById("year");
  let authHeader = "";

  if (year) year.textContent = String(new Date().getFullYear());

  const allowedStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
  const statusMap = {
    received: "Pending", pending: "Pending", processing: "Processing",
    shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled"
  };
  const currency = new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 0
  });
  const money = value => currency.format(Number(value) || 0);

  function setMessage(text, isError = false) {
    if (!message) return;
    message.textContent = text;
    message.style.color = isError ? "var(--danger)" : "var(--success)";
  }

  async function api(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(authHeader ? { Authorization: authHeader } : {}),
        ...(options.body ? { "Content-Type": "application/json" } : {})
      },
      cache: "no-store",
      credentials: "same-origin"
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) throw new Error("Admin sign-in failed. Check your username and password.");
      throw new Error(body.error || `Request failed (${response.status}).`);
    }
    return body;
  }

  function normalizedStatus(order) {
    const raw = String(order.status || "Pending");
    return statusMap[raw.toLowerCase()] || (allowedStatuses.includes(raw) ? raw : "Pending");
  }

  function orderIdentifier(order) {
    return String(order.orderId || order.id || "");
  }

  function makeText(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value == null || value === "" ? "—" : String(value);
    return element;
  }

  function renderOrders(orders) {
    ordersList.replaceChildren();
    if (!Array.isArray(orders) || orders.length === 0) {
      ordersList.append(makeText("p", "muted", "No orders have been placed yet."));
      ordersSection.hidden = false;
      return;
    }

    orders.forEach(order => {
      const card = document.createElement("article");
      card.className = "admin-card admin-order-card";
      const id = orderIdentifier(order);
      const customer = order.customer || {};
      const items = Array.isArray(order.items) ? order.items : [];
      const heading = document.createElement("div");
      heading.className = "admin-order-heading";
      heading.append(makeText("h3", "", `Order ${id || "(missing reference)"}`));
      heading.append(makeText("span", "admin-order-status", normalizedStatus(order)));
      card.append(heading);

      const details = document.createElement("div");
      details.className = "admin-order-details";
      details.append(makeText("p", "", `Customer: ${customer.name || order.name || "—"}`));
      details.append(makeText("p", "", `Email: ${customer.email || order.email || "—"}`));
      details.append(makeText("p", "", `Phone: ${customer.phone || order.phone || "—"}`));
      details.append(makeText("p", "", `Address: ${customer.address || order.address || "—"}`));
      details.append(makeText("p", "", `Placed: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}`));
      card.append(details);

      const itemList = document.createElement("ul");
      itemList.className = "admin-order-items";
      items.forEach(item => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        itemList.append(makeText("li", "", `${item.name || "Item"} × ${qty} — ${money(item.subtotal ?? price * qty)}`));
      });
      card.append(itemList);
      const total = Number(order.total ?? order.submittedTotal ?? items.reduce((sum, item) => sum + (Number(item.subtotal) || (Number(item.price) || 0) * (Number(item.quantity) || 1)), 0));
      card.append(makeText("p", "admin-order-total", `Total: ${money(total)}`));

      const paymentStatus = String(order.paymentStatus || "pending").toLowerCase();
      const paymentLabel = paymentStatus === "paid" ? "Paid" : "Pending";
      const paymentMethod = String(order.paymentMethod || "Not specified")
        .replace(/_/g, " ");

      card.append(makeText("p", "", `Payment status: ${paymentLabel}`));
      card.append(makeText("p", "", `Payment method: ${paymentMethod}`));

      if (paymentStatus !== "paid") {
        const confirmPayment = document.createElement("button");
        confirmPayment.type = "button";
        confirmPayment.className = "button";
        confirmPayment.textContent = "Confirm Payment Received";

        confirmPayment.addEventListener("click", async () => {
          if (!id) {
            return setMessage("This order has no ID and cannot be updated.", true);
          }

          const confirmed = window.confirm(
            `Have you checked your bank or payment record and confirmed that the full amount of ${money(total)} was received for order ${id}?`
          );

          if (!confirmed) return;

          confirmPayment.disabled = true;

          try {
            await api(`/api/orders/${encodeURIComponent(id)}/payment`, {
              method: "PATCH",
              body: JSON.stringify({ paymentStatus: "paid" })
            });

            setMessage(`Payment for order ${id} confirmed.`);
            await loadOrders();
          } catch (error) {
            setMessage(error.message, true);
          } finally {
            confirmPayment.disabled = false;
          }
        });

        card.append(confirmPayment);
      }
      const controls = document.createElement("form");
      controls.className = "admin-order-controls";
      const label = makeText("label", "", "Update status");
      const select = document.createElement("select");
      select.setAttribute("aria-label", `Status for order ${id}`);
      allowedStatuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        option.selected = status === normalizedStatus(order);
        select.append(option);
      });
      const save = document.createElement("button");
      save.type = "submit";
      save.className = "button";
      save.textContent = "Save status";
      controls.append(label, select, save);
      controls.addEventListener("submit", async event => {
        event.preventDefault();
        if (!id) return setMessage("This order has no ID and cannot be updated.", true);
        save.disabled = true;
        try {
          await api(`/api/orders/${encodeURIComponent(id)}/status`, {
            method: "PATCH", body: JSON.stringify({ status: select.value })
          });
          setMessage(`Order ${id} updated.`);
          await loadOrders();
        } catch (error) {
          setMessage(error.message, true);
        } finally {
          save.disabled = false;
        }
      });
      card.append(controls);
      ordersList.append(card);
    });
    ordersSection.hidden = false;
  }

  async function loadOrders() {
    setMessage("Loading orders…");
    try {
      const orders = await api("/api/orders");
      renderOrders(orders);
      setMessage(`${orders.length} order${orders.length === 1 ? "" : "s"} loaded.`);
    } catch (error) {
      setMessage(error.message, true);
      if (error.message.includes("Admin sign-in failed")) {
        authHeader = "";
        ordersSection.hidden = true;
      }
    }
  }

  form?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    authHeader = `Basic ${btoa(`${username}:${password}`)}`;
    loginButton.disabled = true;
    loginButton.textContent = "Signing in…";
    try {
      await loadOrders();
      if (!ordersSection.hidden) passwordInput.value = "";
    } finally {
      loginButton.disabled = false;
      loginButton.textContent = "Load orders";
    }
  });

  refreshButton?.addEventListener("click", loadOrders);
})();
