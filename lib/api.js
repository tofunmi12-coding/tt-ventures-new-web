import crypto from "node:crypto";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { products, store } from "./store";

const scrypt = promisify(crypto.scrypt);
const sessionCookie = "ttv_session";
const sessionDuration = 7 * 24 * 60 * 60 * 1000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data, status = 200, headers = {}) {
  return NextResponse.json(data, { status, headers });
}

function fail(message, status) {
  return json({ error: message }, status);
}

async function readBody(request) {
  if (Number(request.headers.get("content-length") || 0) > 20_000) {
    return { error: "The request is too large." };
  }
  try {
    return await request.json();
  } catch {
    return { error: "The request contains invalid JSON." };
  }
}

function rateLimited(request, limit, key) {
  const now = Date.now();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const bucketKey = `${key}:${ip}`;
  const bucket = store.rateLimits.get(bucketKey);
  if (!bucket || now - bucket.startedAt >= 15 * 60 * 1000) {
    store.rateLimits.set(bucketKey, { startedAt: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

function rateLimitResponse(message) {
  return fail(message, 429);
}

function currentCustomer(request) {
  const token = request.cookies.get(sessionCookie)?.value;
  if (!token) return null;
  const session = store.sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    store.sessions.delete(token);
    return null;
  }
  const user = store.users.find((entry) => entry.id === session.userId);
  if (!user) {
    store.sessions.delete(token);
    return null;
  }
  return { id: user.id, name: user.name, email: user.email };
}

function setSession(response, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  store.sessions.set(token, { userId, expiresAt: Date.now() + sessionDuration });
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDuration / 1000,
  });
}

function clearSession(response, request) {
  const token = request.cookies.get(sessionCookie)?.value;
  if (token) store.sessions.delete(token);
  response.cookies.set(sessionCookie, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

function getPaystackSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY || "";
  return /^sk_(test|live)_[A-Za-z0-9]{20,}$/.test(secret) &&
    !/your_real_key_here/i.test(secret)
    ? secret
    : null;
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function authorizedAdmin(request) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const header = request.headers.get("authorization") || "";
  const encoded = header.match(/^Basic\s+(.+)$/i)?.[1];
  if (!username || !password || !encoded) return false;
  let credentials;
  try {
    credentials = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return false;
  }
  const separator = credentials.indexOf(":");
  return separator >= 0 && safeEqual(credentials.slice(0, separator), username) &&
    safeEqual(credentials.slice(separator + 1), password);
}

function adminRequired() {
  return json({ error: "Authentication required." }, 401, {
    "WWW-Authenticate": 'Basic realm="TT Ventures Admin"',
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}

async function verifyPassword(password, encoded) {
  const [salt, stored] = String(encoded || "").split(":");
  if (!/^[a-f0-9]{32}$/i.test(salt || "") || !/^[a-f0-9]{128}$/i.test(stored || "")) return false;
  const actual = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(stored, "hex"), actual);
}

async function register(request) {
  if (rateLimited(request, 10, "account")) return rateLimitResponse("Too many account attempts. Please wait 15 minutes.");
  const body = await readBody(request);
  if (body?.error) return fail(body.error, 400);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = body?.password;
  if (name.length < 2 || name.length > 100 || !emailPattern.test(email) || email.length > 200 || typeof password !== "string" || password.length < 10 || password.length > 128) {
    return fail("Enter a valid name and email, and a password of 10–128 characters.", 400);
  }
  if (store.users.some((user) => user.email === email)) return fail("An account with this email already exists. Please log in.", 409);
  const user = { id: crypto.randomUUID(), name, email, passwordHash: await hashPassword(password), createdAt: new Date().toISOString() };
  store.users.push(user);
  const response = json({ message: "Your account has been created.", user: { id: user.id, name, email } }, 201);
  setSession(response, user.id);
  return response;
}

async function login(request) {
  if (rateLimited(request, 10, "account")) return rateLimitResponse("Too many account attempts. Please wait 15 minutes.");
  const body = await readBody(request);
  if (body?.error) return fail(body.error, 400);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = body?.password;
  if (!email || typeof password !== "string" || password.length > 128) return fail("Enter your email and password.", 400);
  const user = store.users.find((entry) => entry.email === email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) return fail("Email or password is incorrect.", 401);
  const response = json({ message: "You are now logged in.", user: { id: user.id, name: user.name, email: user.email } });
  setSession(response, user.id);
  return response;
}

async function createOrder(request) {
  if (rateLimited(request, 20, "orders")) return rateLimitResponse("Too many order attempts. Please try again later.");
  const secret = getPaystackSecret();
  if (!secret) return fail("Payment service is not configured correctly.", 503);
  const body = await readBody(request);
  if (body?.error) return fail(body.error, 400);
  const input = body?.customer;
  const submittedItems = body?.items;
  if (!input || typeof input !== "object" || Array.isArray(input)) return fail("Please provide your customer details.", 400);
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const address = typeof input.address === "string" ? input.address.trim() : "";
  if (name.length < 2 || name.length > 100 || !emailPattern.test(email) || email.length > 200 || phone.length < 5 || phone.length > 30 || address.length < 5 || address.length > 1000) return fail("Please provide valid checkout details.", 400);
  if (!Array.isArray(submittedItems) || !submittedItems.length || submittedItems.length > products.length) return fail("Your shopping cart is empty or invalid.", 400);
  const seen = new Set();
  const items = [];
  for (const submitted of submittedItems) {
    const id = Number(submitted?.id);
    const quantity = Number(submitted?.quantity);
    if (!Number.isSafeInteger(id) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99 || seen.has(id)) return fail("Your cart contains invalid items.", 400);
    const product = products.find((entry) => entry.id === id);
    if (!product) return fail("A product in your cart is unavailable.", 400);
    seen.add(id);
    items.push({ id, name: product.name, price: product.price, quantity, subtotal: product.price * quantity });
  }
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  if (!Number.isSafeInteger(total) || total <= 0 || !Number.isSafeInteger(total * 100)) return fail("The order total is invalid.", 400);
  const orderId = `TTV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const responseUrl = new URL("/payment-callback", request.url).toString();
  let accountId = null;
  try { accountId = currentCustomer(request)?.id ?? null; } catch { /* guest checkout */ }
  let paymentResult;
  try {
    const providerResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, amount: total * 100, currency: "NGN", reference: orderId, callback_url: responseUrl, metadata: { orderId, customerName: name } }),
    });
    paymentResult = await providerResponse.json();
    if (!providerResponse.ok || paymentResult.status !== true || !paymentResult.data?.authorization_url || paymentResult.data.reference !== orderId) {
      return fail(paymentResult.message ? `Payment provider rejected the request: ${paymentResult.message}` : "Payment provider returned an invalid response. Please try again.", 502);
    }
  } catch {
    return fail("Payment provider is unreachable. Check the server internet connection and try again.", 503);
  }
  store.orders.unshift({ orderId, customer: { name, email, phone, address }, accountId, items, total, status: "Pending", paymentStatus: "pending", paymentReference: orderId, createdAt: new Date().toISOString() });
  return json({ message: "Payment initialized.", orderId, total, status: "Pending", paymentStatus: "pending", authorization_url: paymentResult.data.authorization_url }, 201);
}

async function verifyPayment(request) {
  const reference = request.nextUrl.searchParams.get("reference")?.trim() || "";
  if (!reference || reference.length > 100) return fail("A valid payment reference is required.", 400);
  const order = store.orders.find((entry) => entry.paymentReference === reference && entry.orderId === reference);
  if (!order) return fail("Order/payment reference not found.", 404);
  if (order.paymentStatus === "paid") return json({ paymentStatus: "paid", orderId: order.orderId, status: order.status });
  const secret = getPaystackSecret();
  if (!secret) return fail("Payment verification is not configured.", 503);
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` } });
    const result = await response.json();
    const transaction = result.data;
    const verified = response.ok && result.status === true && transaction?.status === "success" && transaction.reference === reference && transaction.amount === order.total * 100 && transaction.currency === "NGN" && transaction.metadata?.orderId === order.orderId;
    if (!verified) return json({ paymentStatus: "pending", error: "Paystack has not confirmed this payment as successful." }, 409);
    order.paymentStatus = "paid";
    order.paidAt = new Date().toISOString();
    order.paymentChannel = typeof transaction.channel === "string" ? transaction.channel : null;
    return json({ paymentStatus: "paid", orderId: order.orderId, status: order.status });
  } catch {
    return fail("Could not verify payment. Please try again.", 500);
  }
}

export async function handleApi(request, segments) {
  const method = request.method.toUpperCase();
  if (rateLimited(request, 200, "general")) return rateLimitResponse("Too many requests. Please try again later.");
  const route = segments.join("/");

  if (route === "health" && method === "GET") return json({ status: "ok", service: "TT Ventures" });
  if (route === "auth/register" && method === "POST") return register(request);
  if (route === "auth/login" && method === "POST") return login(request);

  if (route === "auth/me" && method === "GET") {
    const customer = currentCustomer(request);
    if (customer) return json({ user: customer });
    const response = fail("Please log in to continue.", 401);
    clearSession(response, request);
    return response;
  }

  if (route === "auth/logout" && method === "POST") {
    const response = json({ message: "You have logged out." });
    clearSession(response, request);
    return response;
  }

  if (route === "my-wishlist" && method === "GET") {
    const customer = currentCustomer(request);
    if (!customer) return fail("Please log in to continue.", 401);
    const user = store.users.find((entry) => entry.id === customer.id);
    return json(Array.isArray(user?.wishlist) ? user.wishlist : []);
  }

  if (route === "orders" && method === "POST") return createOrder(request);
  if (route === "payments/verify" && method === "GET") return verifyPayment(request);

  if (route === "my-orders" && method === "GET") {
    const customer = currentCustomer(request);
    if (!customer) return fail("Please sign in to view your orders.", 401);
    return json(store.orders.filter((order) => order.accountId === customer.id).map((order) => ({
      orderId: order.orderId, items: order.items, total: order.total, status: order.status,
      paymentStatus: order.paymentStatus || "unrecorded", createdAt: order.createdAt,
    })));
  }

  if (route === "orders" && method === "GET") {
    if (!authorizedAdmin(request)) return adminRequired();
    return json(store.orders);
  }

  const orderRoute = route.match(/^orders\/([^/]+)\/(status|payment)$/);
  if (orderRoute && method === "PATCH") {
    if (!authorizedAdmin(request)) return adminRequired();
    const body = await readBody(request);
    if (body?.error) return fail(body.error, 400);
    const [, orderId, action] = orderRoute;
    const order = store.orders.find((entry) => entry.orderId === decodeURIComponent(orderId) || entry.id === decodeURIComponent(orderId));
    if (!order) return fail("Order not found.", 404);
    if (action === "status") {
      const allowed = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
      if (!allowed.includes(body?.status)) return fail("Invalid order status.", 400);
      order.status = body.status;
      order.updatedAt = new Date().toISOString();
      return json({ message: "Order status updated.", order });
    }
    if (body?.paymentStatus !== "paid") return fail("Only confirmation of received payment is supported.", 400);
    if (String(order.paymentStatus).toLowerCase() === "paid") return json({ message: "Payment was already confirmed.", order });
    if (order.status === "Cancelled") return fail("Cancelled orders cannot have payment confirmed here.", 400);
    order.paymentStatus = "paid";
    order.paidAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    return json({ message: "Payment confirmed.", order });
  }

  return fail("API endpoint not found.", 404);
}
