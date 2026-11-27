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

        /* 2. TOMBOL SIGN IN -> PROFILE*/
        const authBtn = document.getElementById("auth-btn") || document.querySelector(".signIn");
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const fullName = localStorage.getItem("username");

        // Belum login dan coba buka halaman yang perlu login
        if (!isLoggedIn && (window.location.pathname.includes("cart.xhtml") || window.location.pathname.includes("garage.xhtml"))) {
            alert("You must sign in first to access the cart!");
            window.location.href = "register.xhtml"; // Arahkan kembali ke index / sign in
        }

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
        }else if (authBtn){
            // Belum login tetap tombol "Sign In"
            authBtn.innerText = "Sign In";
            authBtn.onclick = function () {
                window.location.href = "signIn.xhtml";
            };
        }
    });