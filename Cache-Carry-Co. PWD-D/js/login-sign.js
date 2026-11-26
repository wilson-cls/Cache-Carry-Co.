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
});