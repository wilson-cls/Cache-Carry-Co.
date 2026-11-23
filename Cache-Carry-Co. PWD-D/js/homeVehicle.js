// MENAMPILKKAN 5 KENDARAAN TERBARU
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