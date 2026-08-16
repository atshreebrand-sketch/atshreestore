const PRODUCTS = [
  { id: 1, n: "Ivory Textured Kurta", c: "Men", p: 1899, i: "/assets/products/ivory-kurta.jpg" },
  { id: 2, n: "Sandstone Kurta Set", c: "Men", p: 2299, i: "/assets/products/sandstone-kurta.jpg" },
  { id: 3, n: "Rose Anarkali Set", c: "Women", p: 2499, i: "/assets/products/rose-anarkali.jpg" },
  { id: 4, n: "Midnight Nehru Jacket", c: "Men", p: 1999, i: "/assets/products/nehru-jacket.jpeg" }
];

const money = n => "₹" + n.toLocaleString("en-IN");

function card(p) { return `<div class="product"><div class="photo"><img src="${p.i}" alt="${p.n}"></div><h3>${p.n}</h3><div class="price">${money(p.p)}</div><a class="btn" href="/product.html?id=${p.id}">VIEW PRODUCT</a></div>`; }
function render(a, id) { const el = document.querySelector(id); if (el) el.innerHTML = a.map(card).join(""); }
function cart() { return JSON.parse(localStorage.getItem("atshree_cart") || "[]"); }
function saveCart(c) { localStorage.setItem("atshree_cart", JSON.stringify(c)); updateBagCount(); }
function add(id, size = "M") { let c = cart(); let item = c.find(x => x.id === id && x.size === size); if (item) item.q++; else c.push({ id, size, q: 1 }); saveCart(c); alert(`${size} added to bag`); }
function removeFromCart(id, size) { saveCart(cart().filter(x => !(x.id === id && x.size === size))); renderCart(); }
function changeQty(id, size, amount) { let c = cart(); let item = c.find(x => x.id === id && x.size === size); if (!item) return; item.q += amount; if (item.q <= 0) c = c.filter(x => !(x.id === id && x.size === size)); saveCart(c); renderCart(); }
function getCartItems() { return cart().map(item => { const product = PRODUCTS.find(p => p.id === item.id); if (!product) return null; return { ...product, size: item.size || "M", q: item.q, total: product.p * item.q }; }).filter(Boolean); }
function cartSubtotal() { return getCartItems().reduce((sum, item) => sum + item.total, 0); }
function shippingCost() { return cartSubtotal() >= 1999 || cartSubtotal() === 0 ? 0 : 99; }
function cartGrandTotal() { return cartSubtotal() + shippingCost(); }
function updateBagCount() { const count = cart().reduce((sum, item) => sum + item.q, 0); document.querySelectorAll(".bag").forEach(el => { el.textContent = count ? `BAG (${count})` : "BAG"; }); }
function renderCart() { const container = document.querySelector("#cartItems"); const subtotalEl = document.querySelector("#cartSubtotal"); const shippingEl = document.querySelector("#cartShipping"); const totalEl = document.querySelector("#cartTotal"); if (!container) return; const items = getCartItems(); if (!items.length) { container.innerHTML = `<div class="emptyCart"><h2>Your bag is empty.</h2><p>Discover something from the ATSHREE collection.</p><a class="btn" href="/shop.html">SHOP COLLECTION</a></div>`; if (subtotalEl) subtotalEl.textContent = "₹0"; if (shippingEl) shippingEl.textContent = "₹0"; if (totalEl) totalEl.textContent = "₹0"; return; } container.innerHTML = items.map(item => `<div class="cartItem"><img src="${item.i}" alt="${item.n}" class="cartImage"><div class="cartInfo"><div class="ey">${item.c}</div><h3>${item.n}</h3><div class="cartPrice">${money(item.p)} · Size ${item.size}</div><div class="qty"><button onclick="changeQty(${item.id}, '${item.size}', -1)">−</button><span>${item.q}</span><button onclick="changeQty(${item.id}, '${item.size}', 1)">+</button></div><button class="remove" onclick="removeFromCart(${item.id}, '${item.size}')">REMOVE</button></div><div class="cartLineTotal">${money(item.total)}</div></div>`).join(""); if (subtotalEl) subtotalEl.textContent = money(cartSubtotal()); if (shippingEl) shippingEl.textContent = shippingCost() === 0 ? "FREE" : money(shippingCost()); if (totalEl) totalEl.textContent = money(cartGrandTotal()); }

function getCustomer() { return JSON.parse(localStorage.getItem("atshree_customer") || "null"); }
function saveCustomer(customer) { localStorage.setItem("atshree_customer", JSON.stringify(customer)); }
function getAddresses() { return JSON.parse(localStorage.getItem("atshree_addresses") || "[]"); }
function saveAddresses(addresses) { localStorage.setItem("atshree_addresses", JSON.stringify(addresses)); }
function getOrders() { return JSON.parse(localStorage.getItem("atshree_orders") || "[]"); }
function getRewards() { return JSON.parse(localStorage.getItem("atshree_rewards") || '{"points":0,"orders":0}'); }
function addRewardPoints(points) { const rewards = getRewards(); rewards.points += Math.max(0, Number(points) || 0); localStorage.setItem("atshree_rewards", JSON.stringify(rewards)); return rewards; }
function rewardTier(points) { if (points >= 1000) return "ATSHREE ELITE"; if (points >= 500) return "ATSHREE PRIVILEGE"; return "ATSHREE INSIDER"; }
function logoutCustomer() { localStorage.removeItem("atshree_customer"); location.href = "/account.html"; }

function renderAccount() {
  const area = document.querySelector("#accountArea"); if (!area) return;
  if (window.atshreeSupabase) return renderSupabaseAccount();
  area.innerHTML = `<div class="accountCard"><div class="ey">ATSHREE ACCOUNT</div><h2>Loading account…</h2></div>`;
}
function createCustomer(form) { saveCustomer({ name: form.name.value.trim(), email: form.email.value.trim(), mobile: form.mobile.value.trim(), createdAt: new Date().toISOString() }); if (!localStorage.getItem("atshree_rewards")) localStorage.setItem("atshree_rewards", JSON.stringify({points:0,orders:0})); renderAccount(); }
function editProfile() { const c = getCustomer(); const name = prompt("Full name", c.name); if (name === null) return; const mobile = prompt("Mobile number", c.mobile || ""); saveCustomer({...c,name:name.trim() || c.name,mobile:mobile.trim()}); renderAccount(); }
function addAddress(form) { const addresses = getAddresses(); addresses.push({label:form.label.value.trim(),name:form.name.value.trim(),mobile:form.mobile.value.trim(),line1:form.line1.value.trim(),line2:form.line2.value.trim(),city:form.city.value.trim(),state:form.state.value.trim(),pin:form.pin.value.trim()}); saveAddresses(addresses); form.reset(); renderAccount(); }
function removeAddress(index) { const addresses = getAddresses(); addresses.splice(index,1); saveAddresses(addresses); renderAccount(); }

function renderRewards() { const area = document.querySelector("#rewardsArea"); if (!area) return; const customer = getCustomer(); if (!customer) { area.innerHTML = `<div class="accountCard centerCard"><div class="ey">ATSHREE REWARDS</div><h2>Join the circle.</h2><p>Create your ATSHREE account to start earning points.</p><a class="btn" href="/account.html">CREATE ACCOUNT</a></div>`; return; } const rewards = getRewards(), points = rewards.points, next = points < 500 ? 500 : points < 1000 ? 1000 : 1000, progress = points >= 1000 ? 100 : Math.min(100, Math.round((points / next) * 100)); area.innerHTML = `<div class="rewardHero"><div class="ey">ATSHREE REWARDS</div><h2>${rewardTier(points)}</h2><div class="bigPoints">${points}</div><p>REWARD POINTS</p><div class="progress"><span style="width:${progress}%"></span></div><p>${points >= 1000 ? "You've reached our highest preview tier." : `${next - points} points to your next tier.`}</p></div><div class="rewardCards"><div class="accountCard"><div class="ey">EARN</div><h3>1 point / ₹100</h3><p>Earn points on eligible purchases after successful payment.</p></div><div class="accountCard"><div class="ey">INSIDER</div><h3>0–499 points</h3><p>Member-only previews and early access.</p></div><div class="accountCard"><div class="ey">PRIVILEGE</div><h3>500–999 points</h3><p>Early access plus special member offers.</p></div><div class="accountCard"><div class="ey">ELITE</div><h3>1,000+ points</h3><p>Priority previews and premium member benefits.</p></div></div>`; }

/* Supabase customer account layer */
const SUPABASE_URL = "https://schsitbayzsqalkvnpbs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rHtZGmayQqlWsI-gJt-i8g_6_7LnaFz";
window.atshreeSupabaseReady = new Promise((resolve) => {
  if (window.supabase) { window.atshreeSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY); resolve(window.atshreeSupabase); return; }
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  s.onload = () => { window.atshreeSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY); resolve(window.atshreeSupabase); };
  s.onerror = () => resolve(null);
  document.head.appendChild(s);
});

async function supaUser() { if (!window.atshreeSupabase) return null; const { data } = await window.atshreeSupabase.auth.getUser(); return data?.user || null; }
async function supaSignUp(form) { const email=form.email.value.trim(), password=form.password.value, name=form.name.value.trim(), mobile=form.mobile.value.trim(); if(password.length<8){alert("Password must be at least 8 characters.");return;} const { data,error }=await window.atshreeSupabase.auth.signUp({email,password,options:{data:{full_name:name,phone:mobile}}}); if(error){alert(error.message);return;} if(data.session){location.reload();} else {alert("Account created. Please check your email to confirm your account, then log in."); renderAccount();} }
async function supaSignIn(form) { const {error}=await window.atshreeSupabase.auth.signInWithPassword({email:form.email.value.trim(),password:form.password.value}); if(error){alert(error.message);return;} location.reload(); }
async function supaLogout(){await window.atshreeSupabase.auth.signOut(); location.reload();}
async function supaSaveProfile(form){const user=await supaUser(); if(!user)return; const {error}=await window.atshreeSupabase.from("profiles").upsert({id:user.id,full_name:form.name.value.trim(),phone:form.mobile.value.trim(),updated_at:new Date().toISOString()}); if(error){alert(error.message);return;} renderSupabaseAccount();}
async function supaAddAddress(form){const user=await supaUser(); if(!user)return; const {error}=await window.atshreeSupabase.from("addresses").insert({user_id:user.id,label:form.label.value.trim(),full_name:form.name.value.trim(),phone:form.mobile.value.trim(),line1:form.line1.value.trim(),line2:form.line2.value.trim(),landmark:form.landmark.value.trim(),city:form.city.value.trim(),state:form.state.value.trim(),postal_code:form.pin.value.trim()}); if(error){alert(error.message);return;} renderSupabaseAccount();}
async function supaRemoveAddress(id){const {error}=await window.atshreeSupabase.from("addresses").delete().eq("id",id); if(error)alert(error.message); else renderSupabaseAccount();}
async function renderSupabaseAccount(){const area=document.querySelector("#accountArea"); if(!area)return; const user=await supaUser(); if(!user){area.innerHTML=`<div class="accountGrid"><div class="accountCard"><div class="ey">ATSHREE ACCOUNT</div><h2>Welcome back.</h2><p>Sign in to access your profile, saved addresses, orders and rewards.</p><form class="form" onsubmit="event.preventDefault();supaSignIn(this)"><input name="email" type="email" placeholder="Email address" required><input name="password" type="password" placeholder="Password" minlength="8" required><button class="btn">SIGN IN</button></form></div><div class="accountCard"><div class="ey">NEW CUSTOMER</div><h2>Join ATSHREE.</h2><form class="form" onsubmit="event.preventDefault();supaSignUp(this)"><input name="name" placeholder="Full name" required><input name="email" type="email" placeholder="Email address" required><input name="mobile" placeholder="Mobile number" required><input name="password" type="password" placeholder="Password (8+ characters)" minlength="8" required><button class="btn">CREATE ACCOUNT</button></form><p class="accountNote">Your account is securely stored with Supabase.</p></div></div>`; return; }
  const [{data:profile},{data:addresses},{data:orders},{data:rewards}] = await Promise.all([
    window.atshreeSupabase.from("profiles").select("full_name,phone").eq("id",user.id).maybeSingle(),
    window.atshreeSupabase.from("addresses").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
    window.atshreeSupabase.from("orders").select("id,status,payment_status,total,created_at").eq("user_id",user.id).order("created_at",{ascending:false}),
    window.atshreeSupabase.from("reward_accounts").select("points,tier").eq("user_id",user.id).maybeSingle()
  ]);
  const name=profile?.full_name||user.user_metadata?.full_name||"ATSHREE Member", phone=profile?.phone||user.phone||"", points=rewards?.points||0, tier=rewards?.tier||rewardTier(points);
  area.innerHTML=`<div class="accountGrid"><div class="accountCard"><div class="ey">MY PROFILE</div><h2>${name}</h2><p>${user.email}<br>${phone}</p><form class="form" onsubmit="event.preventDefault();supaSaveProfile(this)"><input name="name" value="${name.replace(/"/g,'&quot;')}" required><input name="mobile" value="${phone.replace(/"/g,'&quot;')}" placeholder="Mobile number"><button class="btn">SAVE PROFILE</button></form><button class="textBtn" onclick="supaLogout()">LOG OUT</button></div><div class="accountCard"><div class="ey">ATSHREE REWARDS</div><h2>ATSHREE ${tier.toUpperCase()}</h2><div class="rewardPoints">${points}<span>POINTS</span></div><p>Earn 1 point for every ₹100 spent.</p><a class="btn" href="/rewards.html">VIEW REWARDS</a></div></div><div class="accountGrid accountLower"><div class="accountCard"><div class="ey">MY ADDRESSES</div><h2>Delivery details</h2><div class="addressList">${(addresses||[]).map(a=>`<div class="addressItem"><strong>${a.label}</strong><br>${a.full_name}<br>${a.line1}${a.line2?", "+a.line2:""}${a.landmark?", "+a.landmark:""}<br>${a.city}, ${a.state} — ${a.postal_code}<br>Mobile: ${a.phone}<button class="textBtn" onclick="supaRemoveAddress('${a.id}')">REMOVE</button></div>`).join("")||"<p>No saved addresses yet.</p>"}</div><h3>Add address</h3><form class="form" onsubmit="event.preventDefault();supaAddAddress(this)"><input name="label" placeholder="Home / Office" required><input name="name" value="${name.replace(/"/g,'&quot;')}" required><input name="mobile" value="${phone.replace(/"/g,'&quot;')}" required><input name="line1" placeholder="House / Flat / Street" required><input name="line2" placeholder="Area"><input name="landmark" placeholder="Landmark"><div class="checkoutTwo"><input name="city" placeholder="City" required><input name="state" placeholder="State" required></div><input name="pin" placeholder="PIN code" inputmode="numeric" required><button class="btn">SAVE ADDRESS</button></form></div><div class="accountCard"><div class="ey">MY ORDERS</div><h2>Order history</h2>${(orders||[]).map(o=>`<div class="orderMini"><strong>${String(o.id).slice(0,8).toUpperCase()}</strong><span>${o.status}</span><small>${money(Number(o.total))} · ${new Date(o.created_at).toLocaleDateString("en-IN")}</small></div>`).join("")||"<p>No orders yet.</p>"}<a class="btn" href="/shop.html">SHOP COLLECTION</a></div></div>`;
}

window.atshreeSupabaseReady.then(()=>{ if(document.querySelector("#accountArea")) renderSupabaseAccount(); if(document.querySelector("#rewardsArea")) renderRewards(); });
document.addEventListener("DOMContentLoaded", () => { renderCart(); updateBagCount(); renderAccount(); renderRewards(); });
