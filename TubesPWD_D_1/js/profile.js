document.addEventListener("DOMContentLoaded", function () {
  // Ambil data user yang login
    fetch("../TubesPWD_D_1/auth-status.php").then(response => {
      if (!response.ok) {
        throw new Error("Failed to get login status");
      }
      return response.json();
    }).then(user => {
    if (user.isLoggedIn) {
      const initial = user.nama ? user.nama.charAt(0).toUpperCase() : "-";
      const elInitial = document.querySelector(".profile-initial");
      const elNama = document.getElementById("nama-user");
      const elUsername = document.getElementById("username");
      const elEmail = document.getElementById("email");
      const elPhone = document.getElementById("nomor_telepon");
      const elAddress = document.getElementById("address");

      if (elInitial) elInitial.innerText = initial;
      if (elNama) elNama.innerText = user.nama || "-";
      if (elUsername) elUsername.innerText = user.username || "-";
      if (elEmail) elEmail.innerText = user.email || "-";
      if (elPhone) elPhone.innerText = user.nomor_telepon || "-";
      if (elAddress) elAddress.innerText = user.address || "-";
    }else{
      alert("You must sign in first!");
      window.location.href = "login.xhtml";
    }})
    .catch(error => {
      console.error("Error:", error);
    });

    // Balik ke index.xhtml
    const btnBack = document.getElementById("back");
    if (btnBack){
        btnBack.addEventListener("click", function () {
        window.location.href = "../TubesPWD_D_1/index.xhtml";
      });
    }

    // EDIT NYUSAHIASJNDASDASDAD susah bjir
    const btnEdit = document.getElementById("edit");
    let isEditing = false;

    if (btnEdit) {
        btnEdit.addEventListener("click", function () {
        const fields = ["username", "email", "nomor_telepon", "address"];
        if (!isEditing) {
          // Ubah teks menjadi kotak input
          fields.forEach(id => {const el = document.getElementById(id);
        if (el){
          const currentVal = el.innerText === "-" ? "" : el.innerText;
          el.innerHTML = `<input type="text" id="input-${id}" value="${currentVal}" style="background: none; border: 1px solid white; color: #f3f3f3; padding: 4px 8px; border-radius: 15px; font-size: 13px; width: 160px; text-align: right;" />`;
        }});
        btnEdit.innerText = "Save";
        isEditing = true;
      }else{
        // Ambil nilai baru dari input dan kembalikan ke teks
        const updatedData = {};
        fields.forEach(id => {const inputEl = document.getElementById(`input-${id}`); //dia yang nyalain biar bisa ngedit
        const containerEl = document.getElementById(id);
        if(inputEl && containerEl){
          const newVal = inputEl.value.trim() || "-"; updatedData[id] = newVal; containerEl.innerText = newVal;
        }});
        // Biar huruf inisial avatar sesuai
        const elInitial = document.querySelector(".profile-initial");
        if (elInitial && updatedData["nama-user"] !== "-") {
          elInitial.innerText = updatedData["nama-user"].charAt(0).toUpperCase();
        }
        // Kirim perubahan ke server 
        fetch("../TubesPWD_D_1/update-profile.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedData)}).catch(err => console.error("Gagal menyimpan ke server:", err));
        btnEdit.innerText = "Edit";
        isEditing = false;
      }});
    }
    // logout
    const btnLogout = document.getElementById("logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", function () {
        if (confirm("Are you sure you want to sign out?")) {
          window.location.href = "../TubesPWD_D_1/logout.php";
        }});
    }
// =============================================================================
  // ini buat animasi
  const profileContainer = document.getElementById("main-profile");

  if (!profileContainer) return;

  function createSnowflake() {
    const snowflake = document.createElement("div");
    snowflake.classList.add("js-snowflake");
    const size = Math.random() * 4 + 3;
    snowflake.style.width = `${size}px`;
    snowflake.style.height = `${size}px`;

    const containerWidth = profileContainer.clientWidth;
    const startX = Math.random() * containerWidth;
    snowflake.style.left = `${startX}px`;
    const containerHeight = profileContainer.clientHeight;
    const fallDistance = containerHeight - 15;

    const duration = Math.random() * 3 + 3;
    const wind = (Math.random() - 0.5) * 40;

    snowflake.style.setProperty('--fall-distance', `${fallDistance}px`);
    snowflake.style.setProperty('--wind', `${wind}px`);
    snowflake.style.animationDuration = `${duration}s`;
    profileContainer.appendChild(snowflake);
    setTimeout(() => {
      snowflake.remove();
    }, duration * 1000);
  }
  setInterval(createSnowflake, 150);
});