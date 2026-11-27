document.addEventListener("DOMContentLoaded", function () {
    const loginPage = document.getElementById("login-page");

    function createStar() {
        if (!loginPage) return;

        const star = document.createElement("div");
        star.classList.add("star");

        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;

        const posX = Math.random() * window.innerWidth;
        const posY = Math.random() * window.innerHeight;
        star.style.left = `${posX}px`;
        star.style.top = `${posY}px`;

        const duration = Math.random() * 3 + 2;
        star.style.animationDuration = `${duration}s`;
        loginPage.appendChild(star);
        setTimeout(() => {
            star.remove();
        }, duration * 1000);
    }
    setInterval(createStar, 150);

    const registerForm = document.getElementById("register-form");
    const authMessage = document.getElementById("auth-message");

    if (registerForm) {
        registerForm.addEventListener("submit", async function (e) {
            e.preventDefault(); // Cegah halaman biar ga pindah
            const formData = new FormData(registerForm);
            try {
                const response = await fetch(registerForm.getAttribute("action"), {
                    method: "POST",
                    body: formData
                });

                // Error handling misal status HTTP ga 200
                if (!response.ok) {
                    throw new Error("Server responded with status: " + response.status);
                }

                const result = await response.json();

                if (authMessage) {
                    authMessage.textContent = result.message || "An unknown error occurred.";
                    
                    // putih = sukses, meraah = gagal
                    authMessage.style.color = result.success ? "#ffffff" : "#ff5252";
                }

                if (result.success) {
                    registerForm.reset(); // form jadi kosong kalau berhasil
                    // Ntar otomatis ke halaman login sesuai detik yang diatur jika sukses
                    setTimeout(() => {
                        window.location.href = "login.xhtml";
                    }, 2000); // 5000 ini artinya 2 detik
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                if (authMessage) {
                    authMessage.style.display = "block";
                    authMessage.textContent = "Failed to connect to the server. Please check your connection and try again.";
                    authMessage.style.color = "#ffffff";
                }
            }
        });
    }
});