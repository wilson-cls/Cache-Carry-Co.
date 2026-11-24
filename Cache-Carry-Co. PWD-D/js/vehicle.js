
// Get the vehicle container from XHTML
var vehicleContainer = document.getElementById("vehicle-container");

// Get all category checkboxes
var filterAll = document.getElementById("filter-tipe-1");
var filterLand = document.getElementById("filter-tipe-2");
var filterAir = document.getElementById("filter-tipe-3");
var filterSea = document.getElementById("filter-tipe-4");

// sorting vehicle
var sortSelect = document.getElementById("sorting-select");
var searchInput = document.getElementById("vehicle-search");

// membuang respons lama kalau ada response baru
var requestCounter = 0;
var searchTimer = null;

// Function to retrieve vehicles
async function tampilkanKendaraan(kategori, sort, q) {
    var myRequest = ++requestCounter;

    var url = "vehicle.php?kategori=" + encodeURIComponent(kategori) + 
              "&sort=" + encodeURIComponent(sort) + 
              "&q=" + encodeURIComponent(q || "");

    try {
        const response = await fetch(url);
        const result = await response.json();

        if(myRequest !== requestCounter) return;

        if(!response.ok || !result.success){
            throw new Error(result.message || "Failed to fetch data");
        }

        vehicleContainer.innerHTML = "";

        if(result.data.length === 0) {
            vehicleContainer.textContent = "Vehicle not found";
            return;
        }

        result.data.forEach(kendaraan => {
            const card = document.createElement("div");
            card.classList.add("vehicle-card");

            card.style.cursor = "pointer";

            card.addEventListener("click", function() {
                window.location.href = "beliSewa.xhtml?id=" + kendaraan.id_kendaraan;
            })

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

            vehicleContainer.appendChild(card);
        });
    } catch (error) {
        if (myRequest !== requestCounter) return;
        console.error("Error: ", error);
        vehicleContainer.textContent = "Failed to Load Vehicle";
    }
}

function updateTampilan() {
    let selected = [];
    let kategori = "all";

    if(filterAir.checked) selected.push("1");
    if(filterSea.checked) selected.push("2");
    if(filterLand.checked) selected.push("3");

    if(selected.length > 0) {
        filterAll.checked = false;
        kategori = selected.join(",");
    } else {
        filterAll.checked = true;
        kategori = "all";
    }

    let sort = sortSelect.value;
    let q = searchInput ? searchInput.value.trim() : "";

    tampilkanKendaraan(kategori, sort, q);
}

filterAll.addEventListener("change", function(){
    if(filterAll.checked) {
        filterAir.checked = false;
        filterSea.checked = false;
        filterLand.checked = false;
        updateTampilan();
    } else {
        filterAll.checked = true;
    }
});

filterAir.addEventListener("change", updateTampilan);
filterSea.addEventListener("change", updateTampilan);
filterLand.addEventListener("change", updateTampilan);
sortSelect.addEventListener("change", updateTampilan);

if (searchInput) {
    searchInput.addEventListener("input", function() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(updateTampilan, 300);
    });

    searchInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            clearTimeout(searchTimer);
            updateTampilan();
        }
    });
}

var resetBtn = document.getElementById("btn-reset");

if (resetBtn) {
    resetBtn.addEventListener("click", function() {
        filterAll.checked = true;
        filterAir.checked = false;
        filterSea.checked = false;
        filterLand.checked = false;

        sortSelect.value = "nama-asc";

        if(searchInput) searchInput.value = "";
        clearTimeout(searchTimer);

        updateTampilan();
    });
}


// Display all vehicles when the page first opens
updateTampilan();
