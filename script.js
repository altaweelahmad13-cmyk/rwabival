// --- Constants & State ---
const DEFAULTS = {
    products: [
        { id: 1, name: "Premium Coffee", price: 40.0, stock: 15, image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400" },
        { id: 2, name: "Honey Jar", price: 25.0, stock: 30, image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400" }
    ],
    employees: [
        { id: "RS-01", name: "Ahmed", age: 30, address: ["Riyadh", "Main St"] }
    ]
};

let products = JSON.parse(localStorage.getItem('rp_products')) || DEFAULTS.products;
let employees = JSON.parse(localStorage.getItem('rp_employees')) || DEFAULTS.employees;
let users = JSON.parse(localStorage.getItem('rp_users')) || [];
let currentUser = JSON.parse(localStorage.getItem('rp_user')) || null;
let cart = JSON.parse(localStorage.getItem('rp_cart')) || [];
let orders = JSON.parse(localStorage.getItem('rp_orders')) || [];

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    renderAll();
    checkAdmin();
});

function renderAll() {
    renderBar();
    renderStore();
    renderCart();
    renderAdmin();
}

function sync() {
    localStorage.setItem('rp_products', JSON.stringify(products));
    localStorage.setItem('rp_employees', JSON.stringify(employees));
    localStorage.setItem('rp_users', JSON.stringify(users));
    localStorage.setItem('rp_user', JSON.stringify(currentUser));
    localStorage.setItem('rp_cart', JSON.stringify(cart));
    localStorage.setItem('rp_orders', JSON.stringify(orders));
}

// --- UI Logic ---
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'admin') checkAdmin();
}

function renderBar() {
    const disp = document.getElementById('user-display');
    const logB = document.getElementById('login-btn');
    const outB = document.getElementById('logout-btn');
    const count = document.getElementById('cart-count');

    if (currentUser) {
        disp.innerText = `Hi, ${currentUser.name}`;
        logB.style.display = 'none';
        outB.style.display = 'inline-block';
    } else {
        disp.innerText = '';
        logB.style.display = 'inline-block';
        outB.style.display = 'none';
    }
    count.innerText = cart.length;
}

// --- Auth ---
function toggleAuth(isReg) {
    document.getElementById('login-form').style.display = isReg ? 'none' : 'block';
    document.getElementById('reg-form').style.display = isReg ? 'block' : 'none';
    document.getElementById('auth-title').innerText = isReg ? 'Register' : 'Login';
}

function register() {
    const name = document.getElementById('r-name').value;
    const email = document.getElementById('r-email').value;
    const pass = document.getElementById('r-pass').value;
    if (!name || !email || !pass) return alert('Fill all');
    const role = email === 'admin@rawabi.com' ? 'admin' : 'user';
    users.push({ name, email, pass, role });
    sync();
    alert('Registered!');
    toggleAuth(false);
}

function login() {
    const email = document.getElementById('l-email').value;
    const pass = document.getElementById('l-pass').value;
    if (email === 'admin@rawabi.com' && pass === 'admin123') {
        currentUser = { name: 'Admin', role: 'admin' };
    } else {
        const u = users.find(x => x.email === email && x.pass === pass);
        if (!u) return alert('Failed');
        currentUser = u;
    }
    sync(); renderBar(); showSection('home');
}

function logout() { currentUser = null; sync(); renderBar(); showSection('home'); checkAdmin(); }

function checkAdmin() {
    const lock = document.getElementById('admin-lock');
    const panel = document.getElementById('admin-panel');
    if (currentUser && currentUser.role === 'admin') {
        lock.style.display = 'none'; panel.style.display = 'grid';
    } else {
        lock.style.display = 'block'; panel.style.display = 'none';
    }
}

// --- Store ---
function renderStore() {
    const box = document.getElementById('product-list');
    const q = document.getElementById('store-search').value.toLowerCase();
    const res = products.filter(p => p.name.toLowerCase().includes(q));
    box.innerHTML = res.map(p => `
        <div class="glass product-card">
            <img src="${p.image}" class="product-image">
            <h3>${p.name}</h3>
            <p>$${p.price}</p>
            <p style="font-size:0.8rem">Stock: ${p.stock}</p>
            <button class="btn btn-primary" style="margin-top:1rem" onclick="buy(${p.id})">Add to Cart</button>
        </div>
    `).join('');
}

function buy(id) {
    const p = products.find(x => x.id === id);
    if (!p || p.stock <= 0) return alert('Out');
    cart.push({ ...p, cartId: Date.now() });
    sync(); renderBar(); renderCart(); alert('Added');
}

// --- Cart ---
function renderCart() {
    const box = document.getElementById('cart-items');
    const tot = document.getElementById('cart-total');
    if (cart.length === 0) { box.innerHTML = 'Empty'; tot.innerText = '$0.00'; return; }
    let sum = 0;
    box.innerHTML = cart.map(item => {
        sum += item.price;
        return `<div style="display:flex; justify-content:space-between; margin-bottom:1rem">
            <span>${item.name} ($${item.price})</span>
            <button class="btn btn-outline" style="width:auto; padding:2px 10px" onclick="unbuy(${item.cartId})">Delete</button>
        </div>`;
    }).join('');
    tot.innerText = `$${sum.toFixed(2)}`;
}

function unbuy(cid) {
    cart = cart.filter(x => x.cartId !== cid);
    sync(); renderBar(); renderCart();
}

function checkout() {
    if (!currentUser) return showSection('auth');
    if (cart.length === 0) return;
    const cid = 'ORD-' + Date.now();
    orders.push({ id: cid, user: currentUser.name, total: cart.reduce((a, b) => a + b.price, 0), date: new Date().toLocaleDateString() });
    cart.forEach(c => { const p = products.find(x => x.id === c.id); if (p) p.stock--; });
    cart = [];
    sync(); renderAll(); alert('Success: ' + cid); showSection('home');
}

// --- Admin ---
function switchAdmin(t, el) {
    ['products', 'employees', 'orders'].forEach(x => document.getElementById('adm-' + x).style.display = 'none');
    document.querySelectorAll('.admin-nav li').forEach(x => x.classList.remove('active'));
    document.getElementById('adm-' + t).style.display = 'block';
    el.classList.add('active');
}

function renderAdmin() {
    const pt = document.querySelector('#adm-p-table tbody');
    pt.innerHTML = products.map(p => `<tr><td>${p.name}</td><td>$${p.price}</td><td>${p.stock}</td>
        <td><button onclick="editP(${p.id})">Edit</button><button onclick="delP(${p.id})">Del</button></td></tr>`).join('');

    const et = document.querySelector('#adm-e-table tbody');
    et.innerHTML = employees.map((e, idx) => `<tr><td>${e.id}</td><td>${e.name}</td><td>${e.age}</td>
        <td><ul>${e.address.map(a => `<li>${a}</li>`).join('')}</ul></td>
        <td><button onclick="editE(${idx})">Edit</button><button onclick="delE(${idx})">Del</button></td></tr>`).join('');

    const ot = document.querySelector('#adm-o-table tbody');
    ot.innerHTML = orders.map(o => `<tr><td>${o.id}</td><td>${o.user}</td><td>$${o.total}</td><td>${o.date}</td></tr>`).join('');
}

function openModal(t) {
    document.getElementById('modal').style.display = 'flex';
    document.getElementById('p-form').style.display = t === 'product' ? 'block' : 'none';
    document.getElementById('e-form').style.display = t === 'employee' ? 'block' : 'none';
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }

function saveProduct() {
    const id = document.getElementById('edit-p-id').value;
    const n = document.getElementById('p-name').value;
    const p = parseFloat(document.getElementById('p-price').value);
    const s = parseInt(document.getElementById('p-stock').value);
    const i = document.getElementById('p-img').value;
    if (id) {
        const x = products.find(o => o.id == id);
        Object.assign(x, { name: n, price: p, stock: s, image: i });
    } else {
        products.push({ id: Date.now(), name: n, price: p, stock: s, image: i });
    }
    sync(); renderAll(); closeModal();
}

function editP(id) {
    const p = products.find(x => x.id == id);
    document.getElementById('edit-p-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-stock').value = p.stock;
    document.getElementById('p-img').value = p.image;
    openModal('product');
}

function delP(id) { products = products.filter(x => x.id != id); sync(); renderAll(); }

function saveEmployee() {
    const idx = document.getElementById('edit-e-idx').value;
    const id = document.getElementById('e-id').value;
    const n = document.getElementById('e-name').value;
    const a = document.getElementById('e-age').value;
    const addr = document.getElementById('e-addr').value.split(',').map(x => x.trim());
    if (idx !== "") {
        employees[idx] = { id, name: n, age: a, address: addr };
    } else {
        employees.push({ id, name: n, age: a, address: addr });
    }
    sync(); renderAll(); closeModal();
}

function editE(idx) {
    const e = employees[idx];
    document.getElementById('edit-e-idx').value = idx;
    document.getElementById('e-id').value = e.id;
    document.getElementById('e-name').value = e.name;
    document.getElementById('e-age').value = e.age;
    document.getElementById('e-addr').value = e.address.join(', ');
    openModal('employee');
}

function delE(idx) { employees.splice(idx, 1); sync(); renderAll(); }

// --- Location Logic ---
async function detectLocation() {
    const display = document.getElementById('location-display');
    const latSpan = document.getElementById('lat-val');
    const lonSpan = document.getElementById('lon-val');
    const ipSpan = document.getElementById('ip-val');
    const errPanel = document.getElementById('location-error');

    display.style.display = 'grid';
    errPanel.style.display = 'none';
    ipSpan.innerText = 'Detecting...';

    // Get IP
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipSpan.innerText = data.ip;
    } catch (e) {
        ipSpan.innerText = 'Error fetching IP';
    }

    // Get GPS
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
            latSpan.innerText = pos.coords.latitude.toFixed(6);
            lonSpan.innerText = pos.coords.longitude.toFixed(6);
        }, (err) => {
            errPanel.innerText = `GPS Error: ${err.message}`;
            errPanel.style.display = 'block';
            latSpan.innerText = 'Denied';
            lonSpan.innerText = 'Denied';
        });
    } else {
        errPanel.innerText = 'Geolocation is not supported by your browser.';
        errPanel.style.display = 'block';
    }
}

// Exports
window.showSection = showSection; window.toggleAuth = toggleAuth; window.register = register;
window.login = login; window.logout = logout; window.buy = buy; window.unbuy = unbuy;
window.checkout = checkout; window.switchAdmin = switchAdmin; window.openModal = openModal;
window.closeModal = closeModal; window.saveProduct = saveProduct; window.editP = editP;
window.delP = delP; window.saveEmployee = saveEmployee; window.editE = editE; window.delE = delE;
window.renderStore = renderStore; window.detectLocation = detectLocation;
