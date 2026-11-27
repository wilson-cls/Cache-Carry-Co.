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

        if (authBtn){
            fetch("../TubesPWD_D_1/auth-status.php").then(response => {
                    if (!response.ok) {
                        throw new Error("Failed to get login status");
                    }
                    return response.json();
                })
                .then(user => {
                    if (user.isLoggedIn){
                        // Ambil huruf pertama dari nama pengguna
                        const initial = user.nama.charAt(0).toUpperCase();
                        // Tombol profile
                        const profileBtn = document.createElement("button");
                        profileBtn.className = "profile-initial";
                        profileBtn.innerText = initial;
                        profileBtn.title = "Profile - " + user.nama;
                        profileBtn.type = "button";
                        profileBtn.style.cssText = `
                            min-width: 40px;
                            min-height: 40px;
                            border: none;
                            border-radius: 15px;
                            background-color: #FCA311;
                            color: #1E1E1E;
                            font-family: 'Plus Jakarta Sans', sans-serif;
                            font-size: 20px;
                            font-weight: 700;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            appearance: none;
                        `;
                        // Klik prorfile lalu ntar pindah halaman profile
                        profileBtn.onclick = function (){
                            window.location.href = "profile.xhtml";
                        };
                        authBtn.replaceWith(profileBtn);
                    }else{
                        // Belum login, jadi tetap tampil Sign In
                        authBtn.innerText = "Sign In";
                        authBtn.onclick = function (){
                            window.location.href = "login.xhtml";
                        };

                        // Proteksi buat yang perlu login dulu
                        const currentPage = window.location.pathname;
                        if (currentPage.includes("cart.xhtml") || currentPage.includes("garage.xhtml") || currentPage.includes("profile.xhtml")){
                            alert("You must sign in first!");
                            window.location.href = "login.xhtml";
                        }
                    }
                }).catch(error => {
                    console.error("Authentication error:", error);
                });
        }
    });



            /* 3. Tombol Explore Marketplace --> Vehicle 
                  Tombol List a Vehicle --> Garage
            */ 

        const tombolExplore = document.getElementById("explore");
        const tombolList = document.getElementById("list");

        if (tombolExplore) {
            tombolExplore.onclick = function () {
                window.location.href = "../TubesPWD_D_1/vehicle.xhtml";
            };
        }

        // 3. Saat tombol List diklik, pindah ke garage.xhtml
        if (tombolList) {
            tombolList.onclick = function () {
                window.location.href = "../TubesPWD_D_1/garage.xhtml";
            };
        }