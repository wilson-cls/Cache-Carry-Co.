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
        // Ubah 'username' ke 'nama-user' karna username tidak bisa diedit, sedangkan nama bisa diedit
        const fields = ["nama-user", "email", "nomor_telepon", "address"];
        if (!isEditing) {
          fields.forEach(id => {const el = document.getElementById(id);
        if (el){
          const currentVal = el.innerText === "-" ? "" : el.innerText;
          //Mencegah karakter tanda kutip (") merusak atribut value HTML
          const safeVal = currentVal.replace(/"/g, "&quot;");
          if (id === "nama-user") {
            el.innerHTML = `<input type="text" id="input-${id}" value="${safeVal}" style="background: none; border: 1px solid white; color: #f3f3f3; padding: 4px 12px; border-radius: 15px; font-size: 16px; font-weight: 600; width: 200px; text-align: center;" />`;
          } else {
            el.innerHTML = `<input type="text" id="input-${id}" value="${safeVal}" style="background: none; border: 1px solid white; color: #f3f3f3; padding: 4px 8px; border-radius: 15px; font-size: 13px; width: 160px; text-align: right;" />`;
          }
        }});

        // Kembalikan border input email ke putih saat user mulai mengetik ulang
        const emailInput = document.getElementById("input-email");
        if (emailInput) {
          emailInput.addEventListener("input", function () {
            this.style.borderColor = "white";
          });
        }

        btnEdit.innerText = "Save";
        isEditing = true;
      }else{
        // Ambil nilai baru dari input dan kembalikan ke teks
        const updatedData = {};
        fields.forEach(id => {const inputEl = document.getElementById(`input-${id}`); //dia yang nyalain biar bisa ngedit
        if(inputEl){
          // Ubah key 'nama-user' menjadi 'nama' agar cocok dengan parameter di profile.php
          const payloadKey = id === "nama-user" ? "nama" : id;
          updatedData[payloadKey] = inputEl.value.trim();
        }});

        if (!updatedData.nama || !updatedData.email) {
          alert("Nama atau email tidak boleh kosong!");
          return;
        }

        // Kirim perubahan ke server 
        fetch("../TubesPWD_D_1/profile.php", {method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(updatedData)})
          .then(response => response.json())
          .then(result => {
            if (result.success) {
              fields.forEach(id => {
                const containerEl = document.getElementById(id);
                const payloadKey = id === "nama-user" ? "nama" : id;
                if (containerEl) {
                  containerEl.innerText = result.data[payloadKey] || "-";
                }
              });

              // Biar huruf inisial avatar sesuai
              const elInitial = document.querySelector(".profile-initial");
              // Ambil huruf pertama dari result.data.nama langsung dari DB
              if (elInitial && result.data.nama && result.data.nama !== "-") {
                elInitial.innerText = result.data.nama.charAt(0).toUpperCase();
              }

              btnEdit.innerText = "Edit";
              isEditing = false;
            } else if (result.error_type === "duplicate_email") {
              // Peringatan khusus jika email sudah digunakan akun lain
              const emailInput = document.getElementById("input-email");
              if (emailInput) {
                emailInput.style.borderColor = "#ff4d4d";
                emailInput.focus();
                emailInput.select();
              }
              alert("Peringatan Email Duplikat:\n" + result.message);
            } else {
              //Tampilkan pesan error dari PHP, tapi biasanya email sudah dipakai, karna email wajib diisi user dan harus unique
              if (result.error_type === "invalid_email") {
                const emailInput = document.getElementById("input-email");
                if (emailInput) {
                  emailInput.style.borderColor = "#ff4d4d";
                  emailInput.focus();
                }
              }
              alert(result.message || "Failed to update profile.");
            }
          })
          .catch(err => console.error("Failed to save to the server: ", err));
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