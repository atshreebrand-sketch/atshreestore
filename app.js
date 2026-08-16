const PRODUCTS = [
  { id: 1, n: "Ivory Textured Kurta", c: "Men", p: 1899, i: "/assets/products/ivory-kurta.jpg" },
  { id: 2, n: "Sandstone Kurta Set", c: "Men", p: 2299, i: "/assets/products/sandstone-kurta.jpg" },
  { id: 3, n: "Rose Anarkali Set", c: "Women", p: 2499, i: "/assets/products/rose-anarkali.jpg" },
  { id: 4, n: "Midnight Nehru Jacket", c: "Men", p: 1999, i: "/assets/products/nehru-jacket.jpeg" }
];

const money = n => "₹" + n.toLocaleString("en-IN");

function card(p) {
  return `<div class="product"><div class="photo"><img src="${p.i}" alt="${p.n}"></div><h3>${p.n}</h3><div class="price">${money(p.p)}</div><a class="btn" href="/product.html?id=${p.id}">VIEW PRODUCT</a></div>`;
}

function render(a, id) {
  const el = document.querySelector(id);
  if (el) el.innerHTML = a.map(card).join("");
}

function cart() {
  return JSON.parse(localStorage.getItem("atshree_cart") || "[]");
}

function saveCart(c) {
  localStorage.setItem("atshree_cart", JSON.stringify(c));
  updateBagCount();
}

function add(id, size = "M") {
  let c = cart();
  let item = c.find(x => x.id === id && x.size === size);
  if (item) item.q++;
  else c.push({ id, size, q: 1 });
  saveCart(c);
  alert(`${size} added to bag`);
}

function removeFromCart(id, size) {
  saveCart(cart().filter(x => !(x.id === id && x.size === size)));
  renderCart();
}

function changeQty(id, size, amount) {
  let c = cart();
  let item = c.find(x => x.id === id && x.size === size);
  if (!item) return;
  item.q += amount;
  if (item.q <= 0) c = c.filter(x => !(x.id === id && x.size === size));
  saveCart(c);
  renderCart();
}

function getCartItems() {
  return cart().map(item => {
    const product = PRODUCTS.find(p => p.id === item.id);
    if (!product) return null;
    return { ...product, size: item.size || "M", q: item.q, total: product.p * item.q };
  }).filter(Boolean);
}

function cartSubtotal() {
  return getCartItems().reduce((sum, item) => sum + item.total, 0);
}

function shippingCost() {
  return cartSubtotal() >= 1999 || cartSubtotal() === 0 ? 0 : 99;
}

function cartGrandTotal() {
  return cartSubtotal() + shippingCost();
}

function updateBagCount() {
  const count = cart().reduce((sum, item) => sum + item.q, 0);
  document.querySelectorAll(".bag").forEach(el => {
    el.textContent = count ? `BAG (${count})` : "BAG";
  });
}

function renderCart() {
  const container = document.querySelector("#cartItems");
  const subtotalEl = document.querySelector("#cartSubtotal");
  const shippingEl = document.querySelector("#cartShipping");
  const totalEl = document.querySelector("#cartTotal");
  if (!container) return;

  const items = getCartItems();
  if (items.length === 0) {
    container.innerHTML = `<div class="emptyCart"><h2>Your bag is empty.</h2><p>Discover something from the ATSHREE collection.</p><a class="btn" href="/shop.html">SHOP COLLECTION</a></div>`;
    if (subtotalEl) subtotalEl.textContent = "₹0";
    if (shippingEl) shippingEl.textContent = "₹0";
    if (totalEl) totalEl.textContent = "₹0";
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="cartItem">
      <img src="${item.i}" alt="${item.n}" class="cartImage">
      <div class="cartInfo">
        <div class="ey">${item.c}</div>
        <h3>${item.n}</h3>
        <div class="cartPrice">${money(item.p)} · Size ${item.size}</div>
        <div class="qty">
          <button onclick="changeQty(${item.id}, '${item.size}', -1)">−</button>
          <span>${item.q}</span>
          <button onclick="changeQty(${item.id}, '${item.size}', 1)">+</button>
        </div>
        <button class="remove" onclick="removeFromCart(${item.id}, '${item.size}')">REMOVE</button>
      </div>
      <div class="cartLineTotal">${money(item.total)}</div>
    </div>
  `).join("");

  if (subtotalEl) subtotalEl.textContent = money(cartSubtotal());
  if (shippingEl) shippingEl.textContent = shippingCost() === 0 ? "FREE" : money(shippingCost());
  if (totalEl) totalEl.textContent = money(cartGrandTotal());
}

document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  updateBagCount();
});
