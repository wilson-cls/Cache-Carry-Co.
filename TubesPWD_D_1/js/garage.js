document.addEventListener("DOMContentLoaded", function () {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const cardsContainer = document.getElementById("cards-container");

    let currentCategory = "orders";

    function formatCurrency(amount) {
        return "$" + Number(amount).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }
    
    // Fungsi Untuk order Ulang
    function handleReorder(buttonEl, idKendaraan, mode) {
        const originalText = buttonEl.textContent;
        buttonEl.disabled = true;
        buttonEl.textContent = "Processing...";

        fetch("../TubesPWD_D_1/garage.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                action: "reorder",
                id_kendaraan: idKendaraan,
                mode: mode
            })
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    window.location.href = result.redirect || "cart.xhtml";
                } else {
                    alert(result.message || "Gagal menambahkan item ke keranjang.");
                    buttonEl.disabled = false;
                    buttonEl.textContent = originalText;
                }
            })
            .catch(error => {
                console.error("Reorder error:", error);
                alert("Terjadi kesalahan koneksi ke server.");
                buttonEl.disabled = false;
                buttonEl.textContent = originalText;
            });
    }

    function loadTransactions() {
        cardsContainer.innerHTML = '<p class="loading-text">Loading Data</p>';

        fetch(`../TubesPWD_D_1/garage.php?category=${encodeURIComponent(currentCategory)}`, {
            credentials: "same-origin"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("HTTP error! Status: " + response.status);
                }
                return response.json();
            })
            .then(data => {
                renderCards(data);
            })
            .catch(error => {
                console.error("Error:", error);
                cardsContainer.innerHTML = '<p class="loading-text">Failed to load data from the server.</p>';
            });
    }

    function renderCards(items) {
        if (!Array.isArray(items) || items.length === 0) {
            cardsContainer.innerHTML = '<p class="loading-text">No data.</p>';
            return;
        }

        cardsContainer.innerHTML = "";

        items.forEach(item => {
            const card = document.createElement("div");
            card.className = "order-card";

            const imgTag = item.image_url ? `<img src="${item.image_url}" alt="${item.name}" />` : "";

            let tagPillHtml = "";
            if (item.category === "history") {
                tagPillHtml = `<span class="tag-pill">${item.transaction_type}</span>`;
            }

            let rightActionHtml = "";
            if (item.category === "orders") {
                rightActionHtml = `
                    <span class="badge badge-transit">${item.status}</span>
                    <p class="price">${formatCurrency(item.price)}</p>
                    <button type="button" class="btn-primary">Track Order</button>
                `;
            } else if (item.category === "rentals") {
                rightActionHtml = `
                    <span class="badge badge-gold">${item.status}</span>
                    <p class="price">${formatCurrency(item.price)}</p>
                `;
            } else if (item.category === "history") {
                const isBuy = item.transaction_type === "Purchased";
                const btnLabel = isBuy ? "Buy Again" : "Rent Again";
                const mode = isBuy ? "buy" : "rent";

                rightActionHtml = `
                    <span class="badge badge-gold">${item.status}</span>
                    <button type="button" class="btn-primary reorder-btn" data-id="${item.id_kendaraan}" data-mode="${mode}">${btnLabel}</button>
                `;
            }

            card.innerHTML = `
                <div class="card-img">${imgTag}</div>
                <div class="card-info">
                    <div class="info-top">
                        <h4>${item.name}</h4>
                        <span class="location">${item.location}</span>
                    </div>
                    <div class="info-bottom">
                        ${tagPillHtml}
                        <p class="order-time">Order Time : ${item.formatted_date}</p>
                    </div>
                </div>
                <div class="card-action">
                    ${rightActionHtml}
                </div>
            `;

            // Pasang event klik khusus tombol Buy Again / Rent Again
            const reorderBtn = card.querySelector(".reorder-btn");
            if (reorderBtn) {
                reorderBtn.addEventListener("click", function () {
                    const idKendaraan = parseInt(this.getAttribute("data-id"), 10);
                    const mode = this.getAttribute("data-mode");
                    handleReorder(this, idKendaraan, mode);
                });
            }

            cardsContainer.appendChild(card);
        });
    }

    // Interaksi klik tab filter
    tabButtons.forEach(button => {
        button.addEventListener("click", function () {
            tabButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");

            currentCategory = this.getAttribute("data-filter");
            loadTransactions();
        });
    });

    // Panggilan pertama saat halaman dimuat
    loadTransactions();
});