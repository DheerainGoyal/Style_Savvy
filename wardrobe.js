
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
    const imageInput = document.getElementById("item-image");

    const regenerateButton = document.getElementById("regenerate");

    const notificationButton = document.querySelector(".icon-btn");
    const profileButton = document.querySelector(".avatar");

    // Check that important elements exist
    if (!grid || !modal || !form) {
        console.error("Required HTML elements are missing!");
        return;
    }

    // 2. TOAST NOTIFICATION FUNCTION

    function showToast(message) {

        const toast = document.getElementById("toast");

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(window.toastTimer);

        window.toastTimer = setTimeout(function () {
            toast.classList.remove("show");
        }, 2500);
    }


    // 3. LOCAL STORAGE

    let savedItems = JSON.parse(
        localStorage.getItem("wardrobeItems") || "[]"
    );

    let favourites = JSON.parse(
        localStorage.getItem("wardrobeFavourites") || "[]"
    );

    let hiddenItems = JSON.parse(
        localStorage.getItem("wardrobeHidden") || "[]"
    );


    // 4. CREATE CLOTHING CARD

    function createCard(item) {

        const card = document.createElement("div");

        card.className = "clothing-card";
        card.dataset.customItem = "true";

        const imageBox = document.createElement("div");
        imageBox.className = "image-box";

        if (item.image) {

            const img = document.createElement("img");

            img.src = item.image;
            img.alt = item.title;

            imageBox.appendChild(img);

        } else {

            imageBox.textContent = "No image uploaded";
            imageBox.classList.add("no-image");

        }

        const info = document.createElement("div");
        info.className = "item-info";

        const heading = document.createElement("h3");
        heading.textContent = item.title;

        const description = document.createElement("p");
        description.textContent = item.category;

        info.appendChild(heading);
        info.appendChild(description);

        card.appendChild(imageBox);
        card.appendChild(info);

        grid.appendChild(card);

        addCardButtons(card);
    }


    // 5. ADD FAVOURITE AND DELETE BUTTONS

    function addCardButtons(card) {

        if (card.querySelector(".card-actions")) return;

        const name = card.querySelector("h3").textContent.trim();

        const actions = document.createElement("div");
        actions.className = "card-actions";

        // Favourite button

        const favouriteButton = document.createElement("button");

        favouriteButton.type = "button";

        favouriteButton.textContent =
            favourites.includes(name) ? "♥" : "♡";

        favouriteButton.className = "card-favourite";

        if (favourites.includes(name)) {
            favouriteButton.classList.add("is-favourite");
        }

        favouriteButton.addEventListener("click", function () {

            if (favourites.includes(name)) {

                favourites = favourites.filter(item => item !== name);

                favouriteButton.textContent = "♡";
                favouriteButton.classList.remove("is-favourite");

                showToast("Removed from favourites");

            } else {

                favourites.push(name);

                favouriteButton.textContent = "♥";
                favouriteButton.classList.add("is-favourite");

                showToast("Added to favourites");

            }

            localStorage.setItem(
                "wardrobeFavourites",
                JSON.stringify(favourites)
            );

        });


        // Delete button

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "×";
        deleteButton.className = "card-remove";

        deleteButton.addEventListener("click", function () {

            if (!confirm("Do you want to remove " + name + "?")) {
                return;
            }

            if (card.dataset.customItem === "true") {

                savedItems = savedItems.filter(
                    item => item.title !== name
                );

                localStorage.setItem(
                    "wardrobeItems",
                    JSON.stringify(savedItems)
                );

            } else {

                hiddenItems.push(name);

                localStorage.setItem(
                    "wardrobeHidden",
                    JSON.stringify(hiddenItems)
                );

            }

            favourites = favourites.filter(item => item !== name);

            localStorage.setItem(
                "wardrobeFavourites",
                JSON.stringify(favourites)
            );

            card.remove();

            showToast("Item removed successfully");

        });

        actions.appendChild(favouriteButton);
        actions.appendChild(deleteButton);

        card.appendChild(actions);

    }


    // 6. LOAD EXISTING CLOTHES

    grid.querySelectorAll(".clothing-card").forEach(function (card) {

        const name = card.querySelector("h3").textContent.trim();

        if (hiddenItems.includes(name)) {
            card.remove();
        } else {
            addCardButtons(card);
        }

    });

    // Load previously added items

    savedItems.forEach(function (item) {
        createCard(item);
    });


    // 7. SEARCH FUNCTIONALITY

    search.addEventListener("input", function () {

        const query = search.value.toLowerCase().trim();

        grid.querySelectorAll(".clothing-card").forEach(function (card) {

            const name = card.querySelector("h3")
                .textContent.toLowerCase();

            const category = card.querySelector(".item-info p")
                .textContent.toLowerCase();

            const matches =
                name.includes(query) || category.includes(query);

            card.style.display = matches ? "" : "none";

        });

        let message = document.getElementById("no-results");

        const visibleCards = [...grid.querySelectorAll(".clothing-card")]
            .filter(card => card.style.display !== "none");

        if (query && visibleCards.length === 0) {

            if (!message) {

                message = document.createElement("p");
                message.id = "no-results";
                message.textContent = "No clothing items found.";

                grid.insertAdjacentElement("afterend", message);

            }

        } else if (message) {

            message.remove();

        }

    });


    // 8. OPEN ADD ITEM POPUP

    addButton.addEventListener("click", function () {

        form.reset();

        modal.showModal();

    });


    // 9. CLOSE POPUP

    closeButton.addEventListener("click", function () {

        modal.close();

    });


    // Close popup by clicking outside

    modal.addEventListener("click", function (event) {

        if (event.target === modal) {
            modal.close();
        }

    });


    // 10. SAVE NEW CLOTHING ITEM

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        const title = titleInput.value.trim();

        const category = categoryInput.value;

        if (!title) {
            showToast("Please enter an item name");
            return;
        }

        const duplicate = [...grid.querySelectorAll("h3")]
            .some(heading =>
                heading.textContent.trim().toLowerCase() === title.toLowerCase()
            );

        if (duplicate) {
            showToast("This item already exists");
            return;
        }

        const file = imageInput.files[0];

        function saveNewItem(imageData) {

            const newItem = {
                title: title,
                category: category,
                image: imageData
            };

            savedItems.push(newItem);

            localStorage.setItem(
                "wardrobeItems",
                JSON.stringify(savedItems)
            );

            createCard(newItem);

            modal.close();

            form.reset();

            showToast("Item added successfully!");

        }

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

            reader.onload = function () {
                saveNewItem(reader.result);
            };

            reader.onerror = function () {
                showToast("Unable to read image");
            };

            reader.readAsDataURL(file);

        } else {

            saveNewItem("");

        }

    });


    // 11. REGENERATE RECOMMENDED LOOK

    const looks = [

        {
            title: "Today's Recommended Look",
            hero: "A neutral everyday outfit",
            pair: "Try beige with sage green",
            match: "Matches 94% twin"
        },

        {
            title: "Your Next Outfit Idea",
            hero: "A polished casual outfit",
            pair: "Try a shirt with trousers",
            match: "Matches 91% twin"
        },

        {
            title: "Fresh Closet Combination",
            hero: "A soft elegant outfit",
            pair: "Try burgundy with beige",
            match: "Matches 96% twin"
        },

        {
            title: "Weekend Outfit Inspiration",
            hero: "A relaxed weekend outfit",
            pair: "Try denim with a neutral top",
            match: "Matches 93% twin"
        }

    ];

    let currentLook = 0;

    regenerateButton.addEventListener("click", function () {

        currentLook = (currentLook + 1) % looks.length;

        const look = looks[currentLook];

        document.querySelector(".look-title").textContent = look.title;

        document.getElementById("look-hero").textContent = look.hero;

        document.getElementById("look-pair").textContent = look.pair;

        document.getElementById("look-match").textContent = look.match;

        showToast("New look generated!");

    });


    // 12. NOTIFICATION BUTTON

    notificationButton.addEventListener("click", function () {

        showToast("You are all caught up!");

    });


    // 13. PROFILE BUTTON

    profileButton.addEventListener("click", function (event) {

        event.preventDefault();

        showToast("Welcome to your StyleSavvy profile!");

    });


    // 14. ADD EXTRA STYLING FOR BUTTONS

    const style = document.createElement("style");

    style.textContent = `

        .clothing-card {
            position: relative;
        }

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
            font-size: 19px;
            cursor: pointer;
        }

        .card-favourite.is-favourite {
            color: #a13e4a;
        }

        .card-remove {
            color: #292524;
        }

        .image-box.no-image {
            display: flex;
            justify-content: center;
            align-items: center;
            color: #78716c;
            font-size: 13px;
        }

        #item-form label {
            display: block;
            margin: 14px 0;
        }

        #item-form input,
        #item-form select {
            display: block;
            width: 100%;
            padding: 10px;
            margin-top: 6px;
        }

        #item-form .dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }

    `;

    document.head.appendChild(style);


    // 15. WEBSITE READY

    console.log("StyleSavvy Wardrobe is ready!");

});
