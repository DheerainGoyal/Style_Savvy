document.addEventListener("DOMContentLoaded", function () {
  // 1. SELECT HTML ELEMENTS
  const grid = document.getElementById("clothing-grid");
  const search = document.getElementById("search");
  const addButton = document.getElementById("add-item-btn");

  const modal = document.getElementById("item-modal");
  const form = document.getElementById("item-form");
  const closeButton = document.getElementById("close-modal-btn");

  const titleInput = document.getElementById("item-title");
  const categoryInput = document.getElementById("item-category");
  const kindInput = document.getElementById("item-kind");
  const colorInput = document.getElementById("item-color");
  const imageInput = document.getElementById("item-image");

  const regenerateButton = document.getElementById("regenerate");
  const notificationButton = document.querySelector(".icon-btn");
  const profileButton = document.querySelector(".avatar");

  if (!grid || !modal || !form) {
    console.error("Required HTML elements are missing!");
    return;
  }

  // 2. TOAST NOTIFICATION
  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
  }

  // Keep static HTML cards as fallback if MongoDB is empty
  const fallbackHTML = grid.innerHTML;

  // 3. CREATE CLOTHING CARD FROM MONGODB ITEM
  function createCard(item) {
    const card = document.createElement("div");
    card.className = "clothing-card";
    card.dataset.id = item._id || item.id;

    const imageBox = document.createElement("div");
    imageBox.className = "image-box";

    if (item.image) {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.name || item.title;
      imageBox.appendChild(img);
    } else {
      imageBox.style.backgroundColor = item.color || "#f7f7f7";
      imageBox.classList.add("no-image");
      imageBox.textContent = `${item.colorName || "Custom Shade"} (${item.kind || "top"})`;
    }

    const info = document.createElement("div");
    info.className = "item-info";

    const heading = document.createElement("h3");
    heading.textContent = item.name || item.title;

    const description = document.createElement("p");
    const colorTag = item.colorName ? ` • ${item.colorName}` : "";
    const todayTag = item.isTodaysLook ? " • ★ Today's Look" : "";
    description.textContent = `${item.cat || item.category}${colorTag}${todayTag}`;

    info.appendChild(heading);
    info.appendChild(description);

    card.appendChild(imageBox);
    card.appendChild(info);

    grid.appendChild(card);
    addCardButtons(card, item);
  }

  // 4. ADD FAVOURITE, TODAY'S LOOK (PATCH), AND DELETE BUTTONS
  function addCardButtons(card, item = null) {
    if (card.querySelector(".card-actions")) return;

    const name = card.querySelector("h3").textContent.trim();
    const itemId = item?._id || item?.id || card.dataset.id;

    const actions = document.createElement("div");
    actions.className = "card-actions";

    // Mark as "Today's Look" button (PATCH /api/closet/:id)
    if (itemId) {
      const todayBtn = document.createElement("button");
      todayBtn.type = "button";
      todayBtn.textContent = item?.isTodaysLook ? "★" : "☆";
      todayBtn.title = "Mark as Today's Look";
      todayBtn.className = "card-today";
      if (item?.isTodaysLook) todayBtn.style.color = "#c9a96e";

      todayBtn.addEventListener("click", async function () {
        const nextState = !item.isTodaysLook;
        try {
          const res = await fetch(`/api/closet/${itemId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isTodaysLook: nextState }),
          });
          if (!res.ok) throw new Error("Failed to update Today's Look");
          item.isTodaysLook = nextState;
          todayBtn.textContent = nextState ? "★" : "☆";
          todayBtn.style.color = nextState ? "#c9a96e" : "";
          showToast(nextState ? "Marked as Today's Look!" : "Removed from Today's Look");
          loadClosetFromAPI();
        } catch (err) {
          showToast(err.message);
        }
      });
      actions.appendChild(todayBtn);
    }

    // Favourite button (PATCH /api/closet/:id)
    const favouriteButton = document.createElement("button");
    favouriteButton.type = "button";
    favouriteButton.textContent = item?.isFavourite ? "♥" : "♡";
    favouriteButton.className = "card-favourite";
    if (item?.isFavourite) favouriteButton.classList.add("is-favourite");

    favouriteButton.addEventListener("click", async function () {
      if (!itemId) {
        const active = favouriteButton.classList.toggle("is-favourite");
        favouriteButton.textContent = active ? "♥" : "♡";
        showToast(active ? "Added to favourites" : "Removed from favourites");
        return;
      }

      const nextFav = !item.isFavourite;
      try {
        const res = await fetch(`/api/closet/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFavourite: nextFav }),
        });
        if (!res.ok) throw new Error("Could not update favourite");
        item.isFavourite = nextFav;
        favouriteButton.textContent = nextFav ? "♥" : "♡";
        favouriteButton.classList.toggle("is-favourite", nextFav);
        showToast(nextFav ? "Added to favourites" : "Removed from favourites");
      } catch (err) {
        showToast(err.message);
      }
    });

    // Delete button (DELETE /api/closet/:id)
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.className = "card-remove";

    deleteButton.addEventListener("click", async function () {
      if (!confirm("Do you want to remove " + name + "?")) return;

      if (!itemId) {
        card.remove();
        showToast("Item removed");
        return;
      }

      try {
        const res = await fetch(`/api/closet/${itemId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete item");
        card.remove();
        showToast("Item removed from closet");
        loadClosetFromAPI();
      } catch (err) {
        showToast(err.message);
      }
    });

    actions.appendChild(favouriteButton);
    actions.appendChild(deleteButton);
    card.appendChild(actions);
  }

  // 5. FETCH WARDROBE FROM BACKEND (GET /api/closet) WITH FALLBACK
  async function loadClosetFromAPI() {
    try {
      const res = await fetch("/api/closet");
      if (!res.ok) throw new Error("Backend unavailable");
      const items = await res.json();

      localStorage.setItem("ss.closet", JSON.stringify(items));

      if (Array.isArray(items) && items.length > 0) {
        grid.innerHTML = "";
        items.forEach((item) => createCard(item));
      } else {
        grid.innerHTML = fallbackHTML;
        grid.querySelectorAll(".clothing-card").forEach((card) => addCardButtons(card));
      }
    } catch (err) {
      console.warn("Using static fallback wardrobe:", err.message);
      grid.querySelectorAll(".clothing-card").forEach((card) => addCardButtons(card));
    }
  }

  // 6. SEARCH FUNCTIONALITY
  search.addEventListener("input", function () {
    const query = search.value.toLowerCase().trim();
    grid.querySelectorAll(".clothing-card").forEach(function (card) {
      const name = card.querySelector("h3").textContent.toLowerCase();
      const category = card.querySelector(".item-info p").textContent.toLowerCase();
      card.style.display = name.includes(query) || category.includes(query) ? "" : "none";
    });
  });

  // 7. MODAL OPEN / CLOSE
  addButton.addEventListener("click", function () {
    form.reset();
    if (colorInput) colorInput.value = "#c9a96e";
    modal.showModal();
  });

  closeButton.addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });

  // 8. SAVE NEW CLOTHING ITEM (POST /api/closet)
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = titleInput.value.trim();
    const cat = categoryInput.value;
    const kind = kindInput ? kindInput.value : "top";
    const color = colorInput ? colorInput.value : "#c9a96e";

    if (!name) {
      showToast("Please enter an item name");
      return;
    }

    async function postNewItem(imageData) {
      try {
        const res = await fetch("/api/closet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, cat, kind, color, image: imageData }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save item");

        modal.close();
        form.reset();
        showToast(`Added "${data.name}" (${data.colorName})!`);
        await loadClosetFromAPI();
      } catch (err) {
        showToast(err.message);
      }
    }

    const file = imageInput.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Please select an image file");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast("Image must be smaller than 2 MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => postNewItem(reader.result);
      reader.onerror = () => showToast("Unable to read image");
      reader.readAsDataURL(file);
    } else {
      postNewItem("");
    }
  });

  // 9. REGENERATE RECOMMENDED LOOK
  const looks = [
    {
      title: "Today's Recommended Look",
      hero: "A neutral everyday outfit",
      pair: "Try beige with sage green",
      match: "Matches 94% twin",
    },
    {
      title: "Your Next Outfit Idea",
      hero: "A polished casual outfit",
      pair: "Try a shirt with trousers",
      match: "Matches 91% twin",
    },
    {
      title: "Fresh Closet Combination",
      hero: "A soft elegant outfit",
      pair: "Try burgundy with beige",
      match: "Matches 96% twin",
    },
    {
      title: "Weekend Outfit Inspiration",
      hero: "A relaxed weekend outfit",
      pair: "Try denim with a neutral top",
      match: "Matches 93% twin",
    },
  ];

  let currentLook = 0;
  if (regenerateButton) {
    regenerateButton.addEventListener("click", function () {
      currentLook = (currentLook + 1) % looks.length;
      const look = looks[currentLook];
      document.querySelector(".look-title").textContent = look.title;
      document.getElementById("look-hero").textContent = look.hero;
      document.getElementById("look-pair").textContent = look.pair;
      document.getElementById("look-match").textContent = look.match;
      showToast("New look generated!");
    });
  }

  if (notificationButton) {
    notificationButton.addEventListener("click", () => showToast("You are all caught up!"));
  }

  if (profileButton) {
    profileButton.addEventListener("click", (e) => {
      e.preventDefault();
      showToast("Welcome to your StyleSavvy profile!");
    });
  }

  // 10. STYLING FOR CARD ACTION BUTTONS & MODAL
  const style = document.createElement("style");
  style.textContent = `
    .clothing-card { position: relative; }
    .card-actions {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 6px;
    }
    .card-actions button {
      width: 30px;
      height: 30px;
      border: none;
      border-radius: 50%;
      background: white;
      font-size: 17px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.12);
    }
    .card-favourite.is-favourite { color: #a13e4a; }
    .card-remove { color: #292524; }
    .image-box.no-image {
      display: flex;
      justify-content: center;
      align-items: center;
      color: #ffffff;
      text-shadow: 0 1px 3px rgba(0,0,0,0.45);
      font-weight: 600;
      font-size: 13px;
      text-align: center;
      padding: 8px;
    }
    #item-form label { display: block; margin: 12px 0; }
    #item-form input, #item-form select {
      display: block;
      width: 100%;
      padding: 10px;
      margin-top: 6px;
    }
    #item-form input[type="color"] {
      height: 42px;
      padding: 4px;
      cursor: pointer;
    }
    #item-form .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
  `;
  document.head.appendChild(style);

  // Initial load from MongoDB API
  loadClosetFromAPI();
});