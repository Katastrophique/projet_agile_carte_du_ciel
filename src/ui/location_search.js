const input = document.getElementById("locationInput");
const suggestions = document.getElementById("locationSuggestions");

let timer = null;
let lastPlace = null;

if (!input || !suggestions) {
    console.warn("Location search: éléments manquants");
}

input.addEventListener("input", () => {
    const q = input.value.trim();
    clearTimeout(timer);
    console.log("Fonction Inpute : addEventListener " + input.value.trim())
    if (q.length < 3) {
        clearSuggestion();
        return;
    }

    timer = setTimeout(() => searchLocation(q), 400);
});



function searchLocation(query) {
    fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`
    )
        .then(r => r.json())
        .then(data => {
            clearSuggestion();
            console.log("je suis dans la methode SearchLocation (Photon)");

            if (!data || !data.features || !data.features.length) return;

            const feature = data.features[0];

            // On recrée un objet compatible avec ton code existant
            lastPlace = {
                lat: feature.geometry.coordinates[1],
                lon: feature.geometry.coordinates[0],
                display_name: [
                    feature.properties.name,
                    feature.properties.city,
                    feature.properties.country
                ].filter(Boolean).join(", ")
            };

            const li = document.createElement("li");
            li.textContent = lastPlace.display_name;

            li.addEventListener("click", () => {
                applyLocation(lastPlace);
                clearSuggestion();
            });

            li.addEventListener("keydown", (e) => {
                if (e.key !== "Enter") return;
                if (!lastPlace) return;

                e.preventDefault();
                applyLocation(lastPlace);
                clearSuggestion();
                input.blur();
            });

            suggestions.appendChild(li);
        })
        .catch(console.error);

}



function applyLocation(place) {
    if (!place || !window.povView) return;

    const latitude = parseFloat(place.lat);
    const longitude = parseFloat(place.lon);
    const name = place.display_name || "Localisation inconnue";

    window.povView.setObserver(latitude, longitude, name);
}


function clearSuggestion() {
    suggestions.innerHTML = "";
    lastPlace = null;
}

