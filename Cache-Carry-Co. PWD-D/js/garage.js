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

    function loadTransactions() {
        cardsContainer.innerHTML = '<p class="loading-text">Loading Data</p>';

        // Buat amvil data dari backend PHP berdasarkan kategori tab yang aktif
        fetch(`api/get_orders.php?category=${encodeURIComponent(currentCategory)}`)
            .then(response => response.json())
            .then(data => {
                renderCards(data);
            })
            .catch(error => {
                console.error("Error:", error);
                cardsContainer.innerHTML = '<p class="loading-text">Failed to load data from the server.</p>';
                
            });
    }

    function renderCards(items) {
        if (items.length === 0) {
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
                const btnLabel = item.transaction_type === "Purchased" ? "Buy Again" : "Rent Again";
                rightActionHtml = `
                    <span class="badge badge-gold">${item.status}</span>
                    <button type="button" class="btn-primary">${btnLabel}</button>
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