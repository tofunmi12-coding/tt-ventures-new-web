
/* ========================================
   TT VENTURES â€” STORE FUNCTIONALITY
   Demo products, browser cart and checkout
======================================== */

const PRODUCTS = [
    {
        id: 1,
        name: "Essential Black Tee",
        category: "Men's Clothing",
        price: 12000,
        rating: "â˜…â˜…â˜…â˜…â˜…",
        tag: "BESTSELLER",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 2,
        name: "Relaxed Fit Shirt",
        category: "Men's Clothing",
        price: 15000,
        rating: "â˜…â˜…â˜…â˜…â˜…",
        tag: "EVERYDAY",
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 3,
        name: "Streetwear Hoodie",
        category: "Men's Clothing",
        price: 28000,
        rating: "â˜…â˜…â˜…â˜…â˜…",
        tag: "POPULAR",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 4,
        name: "Urban Jacket",
        category: "Men's Clothing",
        price: 38000,
        rating: "â˜…â˜…â˜…â˜…â˜†",
        tag: "NEW",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 5,
        name: "Classic Sneakers",
        category: "Shoes & Sneakers",
        price: 45000,
        rating: "â˜…â˜…â˜…â˜…â˜…",
        tag: "BESTSELLER",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 6,
        name: "Daily Sneakers",
        category: "Shoes & Sneakers",
        price: 52000,
        rating: "â˜…â˜…â˜…â˜…â˜…",
        tag: "JUST IN",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 7,
        name: "Everyday Cap",
        category: "Bags & Accessories",
        price: 9000,
        rating: "â˜…â˜…â˜…â˜…â˜†",
        tag: "",
        image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 8,
        name: "Crossbody Bag",
        category: "Bags & Accessories",
        price: 18000,
        rating: "â˜…â˜…â˜…â˜…â˜…",
        tag: "EVERYDAY",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 9,
        name: "Designer Comfort Sleeper",
        category: "Designer Sleepers",
        price: 14000,
        rating: "â˜…â˜…â˜…â˜…â˜…",
        tag: "COMFORT",
        image: "https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 10,
        name: "Premium Slide Sleeper",
        category: "Designer Sleepers",
        price: 18000,
        rating: "â˜…â˜…â˜…â˜…â˜†",
        tag: "POPULAR",
        image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=700&q=80"
    }
];

const CURRENCY = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
});

const money = amount => CURRENCY.format(amount);

let activeCategory = "All";
let searchTerm = "";
let sortMode = "featured";
let toastTimeout;

/* Keep the cart between page visits in this browser. */
let cart = [];

try {
    const savedCart = JSON.parse(
        localStorage.getItem("tt-ventures-cart") || "[]"
    );

    if (Array.isArray(savedCart)) {
        cart = savedCart
            .filter(item =>
                PRODUCTS.some(product => product.id === item.id) &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0
            )
            .map(item => ({
                id: item.id,
                quantity: Math.min(item.quantity, 99)
            }));
    }
} catch (error) {
    cart = [];
}

/* Show a small message at the bottom of the page. */
function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3600);
}

/* Store cart data safely in the current browser. */
function saveCart() {
    try {
        localStorage.setItem("tt-ventures-cart", JSON.stringify(cart));
    } catch (error) {
        showToast("Your browser could not save the cart.");
    }
}

/* Update cart item counts on both pages. */
function updateCartCount() {
    const count = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    document.querySelectorAll("[data-cart-count]").forEach(element => {
        element.textContent = element.closest(".cart-head")
            ? `(${count})`
            : count;
    });
}

/* Draw the product catalogue on shop.html. */
function renderProducts() {
    const grid = document.getElementById("products-grid");

    if (!grid) return;

    let filtered = PRODUCTS.filter(product => {
        const matchesCategory =
            activeCategory === "All" ||
            product.category === activeCategory;

        const searchableText =
            `${product.name} ${product.category}`.toLowerCase();

        const matchesSearch =
            searchableText.includes(searchTerm.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    if (sortMode === "price-low") {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortMode === "price-high") {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortMode === "name") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    grid.replaceChildren();

    filtered.forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card";

        const imageWrap = document.createElement("div");
        imageWrap.className = "product-image";

        const image = document.createElement("img");
        image.src = product.image;
        image.alt = product.name;
        image.loading = "lazy";

        image.addEventListener("error", () => {
            image.alt = `${product.name} image unavailable`;
        }, { once: true });

        imageWrap.appendChild(image);

        if (product.tag) {
            const tag = document.createElement("span");
            tag.className = "product-tag";
            tag.textContent = product.tag;
            imageWrap.appendChild(tag);
        }

        const addButton = document.createElement("button");
        addButton.className = "quick-add";
        addButton.type = "button";
        addButton.textContent = "Add to bag +";
        addButton.addEventListener(
            "click",
            () => addToCart(product.id)
        );

        imageWrap.appendChild(addButton);

        const info = document.createElement("div");
        info.className = "product-info";

        const category = document.createElement("p");
        category.className = "product-category";
        category.textContent = product.category;

        const title = document.createElement("h3");
        title.textContent = product.name;

        const price = document.createElement("p");
        price.className = "product-price";
        price.textContent = money(product.price);

        const rating = document.createElement("p");
        rating.className = "product-rating";
        rating.textContent = product.rating;

        const ratingNote = document.createElement("span");
        ratingNote.textContent = " Sample rating";
        rating.appendChild(ratingNote);

        info.append(category, title, price, rating);
        card.append(imageWrap, addButton, info);
        grid.appendChild(card);
    });

    const count = document.getElementById("result-count");
    const noResults = document.getElementById("no-results");

    if (count) {
        count.textContent =
            `${filtered.length} ${filtered.length === 1 ? "piece" : "pieces"}`;
    }

    if (noResults) {
        noResults.hidden = filtered.length !== 0;
    }
}

/* Keep category buttons and the URL in sync. */
function setCategory(category, updateUrl = true) {
    const validCategories = [
        "All",
        "Men's Clothing",
        "Shoes & Sneakers",
        "Bags & Accessories",
        "Designer Sleepers"
    ];

    activeCategory = validCategories.includes(category)
        ? category
        : "All";

    document.querySelectorAll("[data-category]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.category === activeCategory
        );
    });

    if (
        updateUrl &&
        (window.location.pathname.endsWith("shop.html") || window.location.pathname === "/shop")
    ) {
        const url = new URL(window.location.href);

        if (activeCategory === "All") {
            url.searchParams.delete("category");
        } else {
            url.searchParams.set("category", activeCategory);
        }

        history.replaceState({}, "", url);
    }

    renderProducts();
}

/* Add an item to the cart. */
function addToCart(productId) {
    const product = PRODUCTS.find(item => item.id === productId);

    if (!product) return;

    const existing = cart.find(item => item.id === productId);

    if (existing) {
        if (existing.quantity >= 99) {
            showToast("Maximum quantity reached.");
            return;
        }

        existing.quantity += 1;
    } else {
        cart.push({
            id: productId,
            quantity: 1
        });
    }

    saveCart();
    renderCart();
    updateCartCount();
    showToast(`${product.name} added to your bag.`);
}

/* Change an item's quantity or remove it. */
function changeQuantity(productId, change) {
    const item = cart.find(entry => entry.id === productId);

    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        cart = cart.filter(entry => entry.id !== productId);
    } else if (item.quantity > 99) {
        item.quantity = 99;
        showToast("Maximum quantity reached.");
    }

    saveCart();
    renderCart();
    updateCartCount();
}

/* Calculate the cart subtotal using actual product prices. */
function calculateCartSubtotal() {
    return cart.reduce((total, item) => {
        const product = PRODUCTS.find(entry => entry.id === item.id);

        if (!product) return total;

        return total + product.price * item.quantity;
    }, 0);
}

/* Render the sliding shopping cart. */
function renderCart() {
    const cartItems = document.getElementById("cart-items");
    const subtotalElement = document.getElementById("cart-subtotal");

    if (cartItems && subtotalElement) {
        cartItems.replaceChildren();

        if (cart.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty-cart";
            empty.textContent =
                "Your bag is empty. Find something you love.";
            cartItems.appendChild(empty);
        }

        cart.forEach(item => {
            const product = PRODUCTS.find(
                entry => entry.id === item.id
            );

            if (!product) return;
            const row = document.createElement("article");
            row.className = "cart-item";

            const image = document.createElement("img");
            image.src = product.image;
            image.alt = product.name;

            const details = document.createElement("div");

            const name = document.createElement("h3");
            name.textContent = product.name;

            const price = document.createElement("p");
            price.textContent = money(product.price * item.quantity);

            const quantityControls = document.createElement("div");
            quantityControls.className = "quantity-controls";

            const minus = document.createElement("button");
            minus.type = "button";
            minus.textContent = "âˆ’";
            minus.setAttribute(
                "aria-label",
                `Remove one ${product.name}`
            );
            minus.addEventListener(
                "click",
                () => changeQuantity(product.id, -1)
            );

            const quantity = document.createElement("span");
            quantity.textContent = item.quantity;

            const plus = document.createElement("button");
            plus.type = "button";
            plus.textContent = "+";
            plus.setAttribute(
                "aria-label",
                `Add one ${product.name}`
            );
            plus.addEventListener(
                "click",
                () => changeQuantity(product.id, 1)
            );

            quantityControls.append(minus, quantity, plus);

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "cart-item-remove";
            remove.textContent = "Remove";

            remove.addEventListener("click", () => {
                cart = cart.filter(
                    entry => entry.id !== product.id
                );

                saveCart();
                renderCart();
                updateCartCount();
            });

            details.append(
                name,
                price,
                quantityControls,
                remove
            );

            row.append(image, details);
            cartItems.appendChild(row);
        });

        subtotalElement.textContent =
            money(calculateCartSubtotal());
    }

    // Keep checkout total updated whenever the cart changes.
    updateCheckoutTotal();
}

/* Open and close the cart drawer. */
let cartOpener = null;

function openCart() {
    const currentDrawer = document.getElementById("cart-drawer");

    if (
        document.activeElement instanceof HTMLElement &&
        !currentDrawer?.contains(document.activeElement)
    ) {
        cartOpener = document.activeElement;
    }

    document.body.classList.add("cart-is-open");

    const drawer = document.getElementById("cart-drawer");
    const backdrop = document.querySelector(".backdrop");

    if (drawer) {
        drawer.classList.add("open");
        drawer.setAttribute("aria-hidden", "false");
        drawer.querySelector(".close-cart")?.focus();
    }

    if (backdrop) {
        backdrop.classList.add("active");
        backdrop.setAttribute("aria-hidden", "false");
    }
}

function closeCart() {
    const drawer = document.getElementById("cart-drawer");
    const backdrop = document.querySelector(".backdrop");
    const focusWasInDrawer = drawer?.contains(document.activeElement);

    // Move focus out before hiding the drawer from assistive technology.
    if (focusWasInDrawer) {
        const returnTarget = cartOpener?.isConnected
            ? cartOpener
            : document.querySelector("[data-open-cart]");

        if (returnTarget && typeof returnTarget.focus === "function") {
            returnTarget.focus();
        } else if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }

    document.body.classList.remove("cart-is-open");

    if (drawer) {
        drawer.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");
    }

    if (backdrop) {
        backdrop.classList.remove("active");
        backdrop.setAttribute("aria-hidden", "true");
    }

    cartOpener = null;
}

document.querySelectorAll("[data-open-cart]").forEach(button => {
    button.addEventListener("click", openCart);
});

document.querySelectorAll("[data-close-cart]").forEach(button => {
    button.addEventListener("click", closeCart);
});

/* Category filtering. */
document.querySelectorAll("[data-category]").forEach(button => {
    button.addEventListener("click", () => {
        setCategory(button.dataset.category);
    });
});

/* Search and sorting. */
const searchInput = document.getElementById("product-search");

if (searchInput) {
    searchInput.addEventListener("input", event => {
        searchTerm = event.target.value.trim();
        renderProducts();
    });
}

const sortSelect = document.getElementById("sort-products");

if (sortSelect) {
    sortSelect.addEventListener("change", event => {
        sortMode = event.target.value;
        renderProducts();
    });
}

const resetButton = document.getElementById("reset-filters");

if (resetButton) {
    resetButton.addEventListener("click", () => {
        searchTerm = "";

        if (searchInput) searchInput.value = "";

        sortMode = "featured";

        if (sortSelect) sortSelect.value = "featured";

        setCategory("All");
    });
}

/* Mobile navigation. */
const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");

if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("open");

        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation" : "Open navigation"
        );
        menuToggle.textContent = isOpen ? "Ã—" : "â˜°";
    });

    mainNav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            mainNav.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation");
            menuToggle.textContent = "â˜°";
        });
    });
}

/* Read a category selected from a homepage link. */
const params = new URLSearchParams(window.location.search);
const requestedCategory = params.get("category");

if (requestedCategory) {
    setCategory(requestedCategory, false);
} else {
    renderProducts();
}

/* Newsletter demo â€” not connected to a mailing service. */
const newsletterForm = document.getElementById("newsletter-form");

if (newsletterForm) {
    newsletterForm.addEventListener("submit", event => {
        event.preventDefault();

        const emailInput =
            document.getElementById("newsletter-email");
        const message =
            document.getElementById("newsletter-message");

        if (
            emailInput &&
            emailInput.checkValidity() &&
            message
        ) {
            message.textContent =
                "Thanks! Newsletter signup needs to be connected.";
            newsletterForm.reset();
        }
    });
}

/* ========================================
   CHECKOUT FORM
======================================== */

const checkoutButton = document.getElementById("checkout-button");
const checkoutOverlay = document.getElementById("checkout-overlay");
const checkoutClose = document.getElementById("checkout-close");
const checkoutForm = document.getElementById("checkout-form");
const checkoutTotal = document.getElementById("checkout-total");
const placeOrderButton =
    document.getElementById("place-order-button");

/* Display the current order total. */
function updateCheckoutTotal() {
    if (checkoutTotal) {
        checkoutTotal.textContent =
            money(calculateCartSubtotal());
    }
}

/* Open the checkout form. */
function openCheckout() {
    if (!checkoutOverlay) {
        showToast("Checkout form not found. Please check index.html.");
        return;
    }

    if (cart.length === 0) {
        showToast("Your bag is empty.");
        return;
    }

    closeCart();
    updateCheckoutTotal();

    checkoutOverlay.classList.add("open", "is-open");
    checkoutOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    document.getElementById("checkout-name")?.focus();
}

/* Close the checkout form. */
function closeCheckout() {
    if (!checkoutOverlay) return;

    checkoutOverlay.classList.remove("open", "is-open");
    checkoutOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

if (checkoutButton) {
    checkoutButton.addEventListener("click", openCheckout);
}

if (checkoutClose) {
    checkoutClose.addEventListener("click", closeCheckout);
}

/* Close when the customer clicks the overlay background. */
if (checkoutOverlay) {
    checkoutOverlay.addEventListener("click", event => {
        if (event.target === checkoutOverlay) {
            closeCheckout();
        }
    });
}

/* Escape closes the checkout and cart. */
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeCheckout();
        closeCart();
    }
});

/* Submit the order to the existing backend. */
if (checkoutForm) {
    checkoutForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (cart.length === 0) {
            showToast("Your bag is empty.");
            closeCheckout();
            return;
        }

        if (!checkoutForm.reportValidity()) return;

        const name = document
            .getElementById("checkout-name").value.trim();

        const email = document
            .getElementById("checkout-email").value.trim();

        const phone = document
            .getElementById("checkout-phone").value.trim();

        const address = document
            .getElementById("checkout-address").value.trim();

        if (!name || !email || !phone || !address) {
            showToast("Please complete all checkout fields.");
            return;
        }

        if (placeOrderButton) {
            placeOrderButton.disabled = true;
            placeOrderButton.textContent = "Submitting order...";
        }

        try {
            // Read the customer's selected payment method.
            const selectedPayment = document.querySelector(
                'input[name="paymentMethod"]:checked'
            );

            if (!selectedPayment) {
                throw new Error("Please choose a payment method.");
            }

            const paymentMethod = selectedPayment.value;

            const allowedMethods = ["paystack"];


            if (!allowedMethods.includes(paymentMethod)) {
                throw new Error("Please choose a valid payment method.");
            }

            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    customer: {
                        name,
                        email,
                        phone,
                        address
                    },
                    items: cart.map(item => ({
                        id: item.id,
                        quantity: item.quantity
                    })),
                    paymentMethod
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Could not start checkout."
                );
            }

            // Continue only when the server returns Paystack's hosted checkout URL.
            if (!result.authorization_url ||
                typeof result.authorization_url !== "string" ||
                !result.authorization_url.startsWith("https://")) {
                throw new Error("Paystack did not return a valid checkout link.");
            }

            window.location.assign(result.authorization_url);
            return;

        } catch (error) {
            console.error("Checkout error:", error);

            showToast(
                error.message ||
                "Could not start payment. Please try again."
            );

        } finally {
            if (placeOrderButton) {
                placeOrderButton.disabled = false;
                placeOrderButton.textContent = "Place Order";
            }
        }
    });
}
