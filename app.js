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

function getCustomer() {
  return JSON.parse(localStorage.getItem("atshree_customer") || "null");
}

function saveCustomer(customer) {
  localStorage.setItem("atshree_customer", JSON.stringify(customer));
}

function logoutCustomer() {
  localStorage.removeItem("atshree_customer");
  location.href = "/account.html";
}

function getRewards() {
  return JSON.parse(localStorage.getItem("atshree_rewards") || '{"points":0,"orders":0}');
}

function addRewardPoints(points) {
  const rewards = getRewards();
  rewards.points += Math.max(0, Number(points) || 0);
  localStorage.setItem("atshree_rewards", JSON.stringify(rewards));
  return rewards;
}

function rewardTier(points) {
  if (points >= 1000) return "ATSHREE ELITE";
  if (points >= 500) return "ATSHREE PRIVILEGE";
  return "ATSHREE INSIDER";
}

function renderAccount() {
  const area = document.querySelector("#accountArea");
  if (!area) return;
  const customer = getCustomer();
  if (!customer) {
    area.innerHTML = `<div class="accountCard"><div class="ey">ATSHREE ACCOUNT</div><h2>Welcome back.</h2><p>Create a customer profile to keep your details, orders and rewards together.</p><form class="form" onsubmit="event.preventDefault();createCustomer(this)"><input name="name" placeholder="Full name" required><input name="email" type="email" placeholder="Email address" required><input name="mobile" placeholder="Mobile number" required><button class="btn">CREATE ACCOUNT</button></form><p class="accountNote">Account authentication is currently a storefront foundation. Secure Supabase authentication will be connected before production launch.</p></div>`;
    return;
  }
  const rewards = getRewards();
  area.innerHTML = `<div class="accountGrid"><div class="accountCard"><div class="ey">MY PROFILE</div><h2>${customer.name}</h2><p>${customer.email}<br>${customer.mobile || ""}</p><a class="btn" href="/rewards.html">MY REWARDS · ${rewards.points} PTS</a><button class="textBtn" onclick="logoutCustomer()">LOG OUT</button></div><div class="accountCard"><div class="ey">ATSHREE REWARDS</div><h2>${rewardTier(rewards.points)}</h2><div class="rewardPoints">${rewards.points}<span>POINTS</span></div><p>Earn 1 point for every ₹100 spent. Rewards are currently in preview mode.</p><a class="btn" href="/rewards.html">VIEW REWARDS</a></div></div>`;
}

function createCustomer(form) {
  saveCustomer({ name: form.name.value.trim(), email: form.email.value.trim(), mobile: form.mobile.value.trim(), createdAt: new Date().toISOString() });
  if (!localStorage.getItem("atshree_rewards")) localStorage.setItem("atshree_rewards", JSON.stringify({points:0,orders:0}));
  renderAccount();
}

function renderRewards() {
  const area = document.querySelector("#rewardsArea");
  if (!area) return;
  const customer = getCustomer();
  if (!customer) {
    area.innerHTML = `<div class="accountCard centerCard"><div class="ey">ATSHREE REWARDS</div><h2>Join the circle.</h2><p>Create your ATSHREE account to start earning points.</p><a class="btn" href="/account.html">CREATE ACCOUNT</a></div>`;
    return;
  }
  const rewards = getRewards();
  const points = rewards.points;
  const next = points < 500 ? 500 : points < 1000 ? 1000 : 1000;
  const progress = points >= 1000 ? 100 : Math.min(100, Math.round((points / next) * 100));
  area.innerHTML = `<div class="rewardHero"><div class="ey">ATSHREE REWARDS</div><h2>${rewardTier(points)}</h2><div class="bigPoints">${points}</div><p>REWARD POINTS</p><div class="progress"><span style="width:${progress}%"></span></div><p>${points >= 1000 ? "You've reached our highest preview tier." : `${next - points} points to your next tier.`}</p></div><div class="rewardCards"><div class="accountCard"><div class="ey">EARN</div><h3>1 point / ₹100</h3><p>Earn points on eligible purchases after successful payment.</p></div><div class="accountCard"><div class="ey">INSIDER</div><h3>0–499 points</h3><p>Member-only previews and early access.</p></div><div class="accountCard"><div class="ey">PRIVILEGE</div><h3>500–999 points</h3><p>Early access plus special member offers.</p></div><div class="accountCard"><div class="ey">ELITE</div><h3>1,000+ points</h3><p>Priority previews and premium member benefits.</p></div></div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  updateBagCount();
  renderAccount();
  renderRewards();
});
