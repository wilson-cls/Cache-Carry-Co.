
// Get the vehicle container from XHTML
var vehicleContainer = document.getElementById("vehicle-container");

// Get all category checkboxes
var filterAll = document.getElementById("filter-tipe-1");
var filterLand = document.getElementById("filter-tipe-2");
var filterAir = document.getElementById("filter-tipe-3");
var filterSea = document.getElementById("filter-tipe-4");


// Function to retrieve vehicles
async function tampilkanKendaraan(kategori) {
    var url = "vehicle.php";

    if (kategori != "all") {
        url += "?kategori=" + kategori;
    }

    try {
        const response = await fetch(url);
        const result = await response.json();

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
        console.error("Error: ", error);
        vehicleContainer.textContent = "Failed to Load Vehicle";
    }
}

function updateFilter() {
    let selected = [];

    if(filterAir.checked) selected.push("1");
    if(filterSea.checked) selected.push("2");
    if(filterLand.checked) selected.push("3");

    if(selected.length > 0) {
        filterAll.checked = false;
        tampilkanKendaraan(selected);
    } else {
        filterAll.checked = true;
        tampilkanKendaraan(["all"]);
    }
}

filterAll.addEventListener("change", function(){
    if(filterAll.checked) {
        filterAir.checked = false;
        filterSea.checked = false;
        filterLand.checked = false;
        tampilkanKendaraan(["all"]);
    } else {
        filterAll.checked = true;
    }
});

filterAir.addEventListener("change", updateFilter);
filterSea.addEventListener("change", updateFilter);
filterLand.addEventListener("change", updateFilter);

// Display all vehicles when the page first opens
tampilkanKendaraan(["all"]);
