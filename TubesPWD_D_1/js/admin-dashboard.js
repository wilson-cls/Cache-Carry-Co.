// Elemen Dashboard Overview
const totalPurchases = document.getElementById("total-purchases");
const totalRentals = document.getElementById("total-rentals");
const totalProcessing = document.getElementById("total-processing");
const totalCompleted = document.getElementById("total-completed");

// Elemen tabel transaksi
const transactionList = document.getElementById("transaction-list");

// Elemen navigasi sidebar
const menuLinks = document.querySelectorAll("menu-link");

// Elemen tombol Sign Out
const signOutButton = document.querySelector("sign-out-button");

// Elemen tombol View All
const viewAllButton = document.querySelector("view-all");


function navigateSidebar() {

    menuLinks.forEach(link => {link.addEventListener("click", function() {
            menuLinks.forEach(menu => {
                menu.classList.remove("active");
            });
            this.classList.add("active");
        });
    });
}