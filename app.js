const PRODUCTS = [
  {
    id: 1,
    n: "Ivory Textured Kurta",
    c: "Men",
    p: 1899,
    i: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: 2,
    n: "Sandstone Kurta Set",
    c: "Men",
    p: 2299,
    i: "https://images.unsplash.com/photo-1597983073493-88cd35cf93c4?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: 3,
    n: "Rose Anarkali Set",
    c: "Women",
    p: 2499,
    i: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: 4,
    n: "Midnight Nehru Jacket",
    c: "Men",
    p: 1999,
    i: "https://images.unsplash.com/photo-1610189012906-4c5b2a0f5c43?auto=format&fit=crop&w=900&q=85"
  }
];

const money = (n) => "₹" + Number(n).toLocaleString("en-IN");

function card(p) {
  return `
    <div class="product">
      <div class="photo">
        <img src="${p.i}" alt="${p.n}" loading="lazy">
      </div>

      <h3>${p.n}</h3>

      <div class="price">
        ${money(p.p)}
      </div>

      <a class="btn" href="product.html?id=${p.id}">
        View Product
      </a>
    </div>
  `;
}

function render(products, selector) {
  const element = document.querySelector(selector);

  if (!element) return;

  element.innerHTML = products.map(card).join("");
}

function cart() {
  try {
    return JSON.parse(localStorage.getItem("atshree_cart") || "[]");
  } catch {
    return [];
  }
}

function add(id) {
  const c = cart();
  const productId = Number(id);

  const existing = c.find((item) => item.id === productId);

  if (existing) {
    existing.q++;
  } else {
    c.push({
      id: productId,
      q: 1
    });
  }

  localStorage.setItem("atshree_cart", JSON.stringify(c));

  alert("Added to bag");
}
