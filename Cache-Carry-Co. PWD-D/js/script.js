document.addEventListener("DOMContentLoaded", function () {
    /* 1. MENU AKTIF (BORDER BOTTOM PINDAH SAAT DIKLIK) */
    const navLinks = document.querySelectorAll("#navMenu a");
    navLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            // Hapus komentar di bawah ini jika href masih kosong ("") agar halaman tidak refresh
            if (this.getAttribute("href") === "") {
                e.preventDefault();
            }
            // Hapus class 'active' (border bawah) dari semua menu
            navLinks.forEach(nav => nav.classList.remove("active"));

            // Tambahkan class 'active' ke menu yang baru saja diklik
            this.classList.add("active");
        });
    });

    /* 2. TOMBOL SIGN IN -> PROFILE [Masih pakai data sementara]*/
    const authBtn = document.getElementById("auth-btn") || document.querySelector(".signIn");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const fullName = localStorage.getItem("username") || "Thomas Wilson";

    if (isLoggedIn && authBtn) {
        const profileImg = document.createElement("img");
        profileImg.src = "../Cache-Carry-Co. PWD-D/images/Login.svg";
        profileImg.alt = "Profile Logo"
        profileImg.style.width = "40px";
        profileImg.style.height = "40px";
        profileImg.style.objectFit = "cover";
        profileImg.style.cursor = "pointer";
        profileImg.title = `Logged in as ${fullName} (Klik untuk Logout)`;
        authBtn.replaceWith(profileImg);
        profileImg.onclick = function () {
            if (confirm(`Keluar dari akun ${fullName}?`)) {
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("username");
                location.reload();
            }
        };
    } else if (authBtn) {
        // Belum login tetap tombol "Sign In"
        authBtn.innerText = "Sign In";
        authBtn.onclick = function () {
            const inputName = prompt("Masukkan nama kamu (Simulasi Login):", "Thomas Wilson");
            if (inputName) {
                localStorage.setItem("isLoggedIn", "true");
               localStorage.setItem("username", inputName);
                location.reload();
            }
        };
    }

    // 3. MENAMPILKKAN 5 KENDARAAN TERBARU
    const productContainer = document.getElementById("product-container");
    
    async function showVehicle() {
        try {
            const response = await fetch("get_kendaraan.php"); //fetch data
            const result = await response.json(); // json jadi objek js

            if(!response.ok || !result.success) {
                throw new Error(result.message || "Failed to fetch data");
            }

            productContainer.innerHTML = "";

            if(result.data.length === 0) {
                productContainer.textContent = "No vehicle available yet";
                return;
            }

            result.data.forEach(kendaraan => {
                const card = document.createElement("div");
                card.classList.add("product-card");

                const img = document.createElement("img");
                img.src = kendaraan.foto;
                img.alt = kendaraan.nama || "Vehicle image";

                const nama = document.createElement("h3");
                nama.textContent = kendaraan.nama;

                const merek = document.createElement("p");
                merek.textContent = kendaraan.merek || "-";

                const tahun = document.createElement("p");
                tahun.textContent = "Year: " + (kendaraan.tahun || "-");

                const jual = document.createElement("p");
                jual.textContent = "Buy: " + kendaraan.harga_jual;

                const sewa = document.createElement("p");
                sewa.textContent = "Rent: " + kendaraan.harga_sewa;

                card.appendChild(img);
                card.appendChild(nama);
                card.appendChild(merek);
                card.appendChild(tahun);
                card.appendChild(jual);
                card.appendChild(sewa);

                productContainer.appendChild(card);
            });
        } catch (error) {
            console.error("Error: ", error);
            productContainer.textContent = "Failed to Load Vehicle";
        }
    }

    showVehicle();
});