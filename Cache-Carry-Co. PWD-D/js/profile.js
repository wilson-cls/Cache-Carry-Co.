// jika tombol sign out di klik --> masuk laman ke login
const signOutBtn = document.getElementById("btn-sign-out");
const profileBtn = document.getElementById("profile-btn");
const hoverName = document.getElementById("hover-name");
const profileNameSource = document.getElementById("profile-name");

if (signOutBtn) {
  signOutBtn.addEventListener("click", function () {
    window.location.href = "../Cache-Carry-Co. PWD-D/login.xhtml";
  });
}

if (profileBtn) {
  profileBtn.style.cursor = "pointer";
  profileBtn.title = "Logged in as Thomas Wilson";
  profileBtn.addEventListener("click", function () {
    window.location.reload();
  });
}
