/* ---------------------------
   Core Data / Demo Products
---------------------------- */
const products = [
  { id: 1, name: "Classic White T-Shirt", price: 1999.99, image: "OIP (4).jpg", category: "tops" },
  { id: 2, name: "Blue Denim Jacket", price: 4999.99, image: "OIP.webp", category: "outerwear" },
  { id: 3, name: "Summer Floral Dress", price: 3879.99, image: "OIP (1).webp", category: "dresses" },
  { id: 4, name: "Black Skinny Jeans", price: 2990.99, image: "OIP (2).webp", category: "bottoms" },
  { id: 5, name: "Red Hoodie", price: 3450.99, image: "download.webp", category: "hoodies" },
  { id: 6, name: "Beige Chinos", price: 927.99, image: "OIF.webp", category: "trousers" },
];

/* ---------------------------
   Utilities
---------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function formatINR(value) {
  return value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}
function setCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* ---------------------------
   Theme Toggle (persist)
---------------------------- */
(function initTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  applyTheme(theme);
  const toggle = $("#theme-toggle");
  if (toggle) {
    toggle.textContent = theme === "dark" ? "☀️" : "🌙";
    toggle.addEventListener("click", () => {
      const newTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
      applyTheme(newTheme);
      toggle.textContent = newTheme === "dark" ? "☀️" : "🌙";
    });
  }
})();
function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem("theme", theme);
}

/* ---------------------------
   Toast
---------------------------- */
let toastTimeout;
function showToast(msg) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

/* ---------------------------
   Landing click-to-enter
---------------------------- */
(function initLanding() {
  const landing = $("#landing");
  if (!landing) return;
  landing.addEventListener("click", () => {
    landing.classList.add("fade-out");
    window.location.href = "products.html";
  });
})();

/* ---------------------------
   Products Page Logic
---------------------------- */
(function initProducts() {
  const productList = $("#product-list");
  if (!productList) return;

  // Render products with filters & sorting.
  const searchInput = $("#search");
  const categorySelect = $("#category");
  const priceRange = $("#price");
  const priceValue = $("#price-value");
  const sortSelect = $("#sort");

  let state = {
    query: "",
    category: "all",
    maxPrice: Number(priceRange ? priceRange.value : 10000),
    sort: "default"
  };

  const applyFilters = () => {
    let items = [...products];

    // search
    if (state.query.trim()) {
      const q = state.query.trim().toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(q));
    }
    // category
    if (state.category !== "all") {
      items = items.filter(p => p.category === state.category);
    }
    // price
    items = items.filter(p => p.price <= state.maxPrice);

    // sort
    switch (state.sort) {
      case "price-asc":
        items.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        items.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        items.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    renderProducts(items);
  };

  function renderProducts(list) {
    productList.innerHTML = "";
    if (!list.length) {
      productList.innerHTML = `<p>No products found.</p>`;
      return;
    }
    list.forEach(product => {
      const div = document.createElement("div");
      div.className = "product-card";
      div.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>₹${formatINR(product.price)}</p>
        <button data-id="${product.id}">Add to Cart</button>
      `;
      productList.appendChild(div);
    });

    // attach add-to-cart handlers
    $$(".product-card button", productList).forEach(btn => {
      btn.addEventListener("click", e => {
        const id = Number(e.currentTarget.getAttribute("data-id"));
        addToCart(id);
      });
    });
  }

  // Bind filters
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      state.query = e.target.value;
      applyFilters();
    });
  }
  if (categorySelect) {
    categorySelect.addEventListener("change", e => {
      state.category = e.target.value;
      applyFilters();
    });
  }
  if (priceRange) {
    priceRange.addEventListener("input", e => {
      state.maxPrice = Number(e.target.value);
      priceValue.textContent = state.maxPrice;
      applyFilters();
    });
  }
  if (sortSelect) {
    sortSelect.addEventListener("change", e => {
      state.sort = e.target.value;
      applyFilters();
    });
  }

  // initial load
  applyFilters();
})();

function addToCart(productId) {
  let cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty += 1;
  } else {
    const prod = products.find(p => p.id === productId);
    cart.push({ ...prod, qty: 1 });
  }
  setCart(cart);
  showToast("Added to cart!");
}

/* ---------------------------
   Cart Page Logic
---------------------------- */
(function initCart() {
  const cartItemsDiv = $("#cart-items");
  if (!cartItemsDiv) return;

  const cartSummaryDiv = $("#cart-summary");
  const placeOrderBtn = $("#place-order-btn");
  const orderForm = $("#order-form");
  const orderSuccess = $("#order-success");
  const couponInput = $("#coupon");
  const applyCouponBtn = $("#apply-coupon");

  let appliedCoupon = null;

  function calcTotals(cart) {
    let subtotal = 0;
    cart.forEach(item => (subtotal += item.price * item.qty));
    let discount = 0;
    if (appliedCoupon === "SAVE10") discount = subtotal * 0.1;
    const tax = (subtotal - discount) * 0.05; // 5% tax example
    const total = subtotal - discount + tax;
    return { subtotal, discount, tax, total };
  }

  function renderCart() {
    const cart = getCart();
    if (cart.length === 0) {
      cartItemsDiv.innerHTML = "<p>Your cart is empty.</p>";
      cartSummaryDiv.innerHTML = "";
      if (placeOrderBtn) placeOrderBtn.style.display = "none";
      return;
    }

    placeOrderBtn.style.display = "inline-block";

    cartItemsDiv.innerHTML = "";
    cart.forEach(item => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "cart-item";
      itemDiv.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-details">
          <span class="cart-item-name">${item.name}</span><br>
          <span>Price: ₹${formatINR(item.price)}</span>
        </div>
        <div class="qty-controls">
          <button class="qty-minus" data-id="${item.id}">-</button>
          <span class="cart-item-qty">${item.qty}</span>
          <button class="qty-plus" data-id="${item.id}">+</button>
        </div>
        <span>₹${formatINR(item.price * item.qty)}</span>
        <span class="cart-item-remove" data-id="${item.id}" title="Remove">&times;</span>
      `;
      cartItemsDiv.appendChild(itemDiv);
    });

    const totals = calcTotals(cart);
    cartSummaryDiv.innerHTML = `
      <div>Subtotal: ₹${formatINR(totals.subtotal)}</div>
      <div>Discount: -₹${formatINR(totals.discount)}</div>
      <div>Tax (5%): ₹${formatINR(totals.tax)}</div>
      <div><strong>Total: ₹${formatINR(totals.total)}</strong></div>
    `;

    // Bind qty +/- and remove
    $$(".qty-minus", cartItemsDiv).forEach(btn => btn.addEventListener("click", onQtyMinus));
    $$(".qty-plus", cartItemsDiv).forEach(btn => btn.addEventListener("click", onQtyPlus));
    $$(".cart-item-remove", cartItemsDiv).forEach(btn => btn.addEventListener("click", onRemoveItem));
  }

  function onQtyMinus(e) {
    const id = Number(e.currentTarget.getAttribute("data-id"));
    let cart = getCart();
    const it = cart.find(i => i.id === id);
    if (!it) return;
    it.qty = Math.max(1, it.qty - 1);
    setCart(cart);
    renderCart();
  }
  function onQtyPlus(e) {
    const id = Number(e.currentTarget.getAttribute("data-id"));
    let cart = getCart();
    const it = cart.find(i => i.id === id);
    if (!it) return;
    it.qty += 1;
    setCart(cart);
    renderCart();
  }
  function onRemoveItem(e) {
    const id = Number(e.currentTarget.getAttribute("data-id"));
    let cart = getCart().filter(i => i.id !== id);
    setCart(cart);
    renderCart();
  }

  if (placeOrderBtn) {
    placeOrderBtn.onclick = function () {
      orderForm.style.display = "block";
      this.style.display = "none";
    };
  }

  if (orderForm) {
    orderForm.onsubmit = function (e) {
      e.preventDefault();
      // simulate order success
      setCart([]);
      cartItemsDiv.style.display = "none";
      cartSummaryDiv.style.display = "none";
      orderForm.style.display = "none";
      orderSuccess.style.display = "block";
      showToast("Order placed successfully!");
    };
  }

  if (applyCouponBtn && couponInput) {
    applyCouponBtn.addEventListener("click", () => {
      const code = couponInput.value.trim().toUpperCase();
      if (code === "SAVE10") {
        appliedCoupon = code;
        showToast("Coupon applied: 10% off");
      } else {
        appliedCoupon = null;
        showToast("Invalid coupon");
      }
      renderCart();
    });
  }

  renderCart();
})();

/* ---------------------------
   Contact Form (demo)
---------------------------- */
(function initContact() {
  const form = $("#contact-form");
  if (!form) return;
  const success = $("#contact-success");

  form.addEventListener("submit", e => {
    e.preventDefault();
    form.reset();
    success.classList.remove("hidden");
    showToast("Message sent. Thanks!");
  });
})();
