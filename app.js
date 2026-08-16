const PRODUCTS = [
  {
    id: 1,
    n: "Ivory Textured Kurta",
    c: "Men",
    p: 1899,
    i: "/assets/products/ivory-kurta.jpg"
  },
  {
    id: 2,
    n: "Sandstone Kurta Set",
    c: "Men",
    p: 2299,
    i: "/assets/products/sandstone-kurta.jpg"
  },
  {
    id: 3,
    n: "Rose Anarkali Set",
    c: "Women",
    p: 2499,
    i: "/assets/products/rose-anarkali.jpg"
  },
  {
    id: 4,
    n: "Midnight Nehru Jacket",
    c: "Men",
    p: 1999,
    i: "/assets/products/nehru-jacket.jpg"
  }
];

const money = n => "₹" + n.toLocaleString("en-IN");

function card(p) {
  return `
    <div class="product">
      <div class="photo">
        <img src="${p.i}" alt="${p.n}">
      </div>
      <h3>${p.n}</h3>
      <div class="price">${money(p.p)}</div>
      <a class="btn" href="/pages/product.html?id=${p.id}">
        View Product
      </a>
    </div>
  `;
}

function render(a, id) {
  const el = document.querySelector(id);
  if (el) el.innerHTML = a.map(card).join("");
}

function cart() {
  return JSON.parse(localStorage.getItem("atshree_cart") || "[]");
}

function add(id) {
  let c = cart();
  let x = c.find(a => a.id === id);

  if (x) {
    x.q++;
  } else {
    c.push({ id, q: 1 });
  }

  localStorage.setItem("atshree_cart", JSON.stringify(c));
  alert("Added to bag");
}
