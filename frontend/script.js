// ================= DOM =================
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const loginMessage = document.getElementById("loginMessage");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const phoneInput = document.getElementById("phone");

  const oneDayProductsContainer = document.getElementById("oneDayProducts");
  const oneWeekProductsContainer = document.getElementById("oneWeekProducts");
  const orderMessage = document.getElementById("orderMessage");

  // ================= STATE =================
  let currentPlanPage = "";
  let cart = {};

  // ================= HELPER =================
  function showMessage(element, text, color) {
    element.textContent = text;
    element.style.color = color;
  }

  // ================= LOGIN =================
  loginBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!password || (!email && !username)) {
      showMessage(loginMessage, "Enter username/email & password", "red");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      showMessage(loginMessage, "Login successful!", "green");

      setTimeout(() => {
        showPage("subscriptionPage");
      }, 1000);

    } catch (err) {
      showMessage(loginMessage, err.message, "red");
    }
  });

  // ================= SIGNUP =================
  signupBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!username || !email || !password || !phone) {
      showMessage(loginMessage, "Enter all fields", "red");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, phone })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showMessage(loginMessage, "Signup successful! Now login.", "green");

    } catch (err) {
      showMessage(loginMessage, err.message, "red");
    }
  });

  // ================= PAGE NAV =================
  window.showPage = function (pageId) {
    document.querySelectorAll(".page").forEach(page => {
      page.classList.add("hidden");
      page.classList.remove("active");
    });

    document.getElementById(pageId).classList.remove("hidden");
    document.getElementById(pageId).classList.add("active");
  };

  // ================= PLAN PAGE =================
  window.openPlanPage = function (pageId) {
    showPage(pageId);
  };

  // ================= PRODUCTS WITH IMAGES =================
  const oneDayItems = [
    { name: "Apple", price: 120, image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500" },
    { name: "Banana", price: 60, image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500" },
    { name: "Orange", price: 90, image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=500" }
  ];

  const oneWeekItems = [
    { name: "Mango", price: 150, image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500" },
    { name: "Pineapple", price: 80, image: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500" },
    { name: "Grapes", price: 100, image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500" }
  ];

  function renderProducts(items, container) {
    container.innerHTML = "";

    items.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("product-card");

      div.innerHTML = `
        <img src="${item.image}" alt="${item.name}" />
        <h3>${item.name}</h3>
        <p>₹${item.price}</p>
        <div class="product-btn-group">
          <button onclick="addToCart('${item.name}', ${item.price})">Add</button>
          <button onclick="increaseQty('${item.name}', ${item.price})">+</button>
          <button onclick="decreaseQty('${item.name}')">-</button>
        </div>
        <p class="qty-text" id="qty-${item.name}">Quantity: 0</p>
      `;

      container.appendChild(div);
    });
  }

  renderProducts(oneDayItems, oneDayProductsContainer);
  renderProducts(oneWeekItems, oneWeekProductsContainer);

  // ================= CART =================
  // Add button — adds item first time
  window.addToCart = function (name, price) {
    if (!cart[name]) {
      cart[name] = { quantity: 1, price };
    } else {
      cart[name].quantity++;
    }
    updateQtyDisplay(name);
  };

  // + button — increase quantity
  window.increaseQty = function (name, price) {
    if (!cart[name]) {
      cart[name] = { quantity: 1, price };
    } else {
      cart[name].quantity++;
    }
    updateQtyDisplay(name);
  };

  // - button — decrease quantity
  window.decreaseQty = function (name) {
    if (cart[name] && cart[name].quantity > 0) {
      cart[name].quantity--;
      if (cart[name].quantity === 0) {
        delete cart[name]; // remove from cart if 0
      }
    }
    updateQtyDisplay(name);
  };

  // Updates the "Quantity: X" text on the card
  function updateQtyDisplay(name) {
    const qtyEl = document.getElementById("qty-" + name);
    if (qtyEl) {
      qtyEl.textContent = "Quantity: " + (cart[name] ? cart[name].quantity : 0);
    }
  }

  // ================= ORDER =================
  window.openOrderPage = function (planPage) {
    currentPlanPage = planPage;
    showPage("orderPage");
  };

  window.goBackToPlanPage = function () {
    showPage(currentPlanPage);
  };

  window.submitOrder = async function () {
    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const address = document.getElementById("customerAddress").value.trim();

    if (!name || !phone || !address) {
      showMessage(orderMessage, "Fill all fields", "red");
      return;
    }

    const token = localStorage.getItem("token");

    const items = Object.keys(cart).map(key => ({
      name: key,
      quantity: cart[key].quantity,
      price: cart[key].price
    }));

    try {
      const res = await fetch("http://localhost:5001/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          customerName: name,
          phone,
          address,
          planName: currentPlanPage,
          items
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showMessage(orderMessage, "Order placed successfully ✅", "green");
      cart = {};

    } catch (err) {
      showMessage(orderMessage, err.message, "red");
    }
  };

  // ================= LOGOUT =================
  window.logout = function () {
    localStorage.removeItem("token");
    showPage("loginPage");
  };
});