// faire le JS des filtre
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const type = btn.dataset.filter;

        let message = "";

        switch(type) {
            case "nearby":
                message = "Affichera les 50 étoiles les plus proches.\n\nObjectif : comprendre notre voisinage stellaire.";
                break;
                
            case "brightest":
                message = "Affichera les 50 étoiles les plus brillantes.\n\nObjectif : analyser leur luminosité.";
                break;
                
            case "hottest":
                message = "Affichera les 50 étoiles les plus chaudes.\n\nObjectif : étudier leur température.";
                break;
                
            case "largest":
                message = "Affichera les 50 plus grosses étoiles.\n\nObjectif : comparer leur taille relative.";
                break;
                
            case "constellation":
                message = "Affichera les étoiles d'une constellation choisie.\n\nObjectif : visualiser une constellation précise.";
                break;
        }

        alert("Filtre sélectionné :\n\n" + message);
    });
});
