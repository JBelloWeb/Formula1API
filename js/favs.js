const overallAPI = 'https://api.openf1.org/v1/championship_drivers?';
const driversApi = 'https://api.openf1.org/v1/drivers?';


const d = document;
const favSections = d.getElementById('favSection');
const btnToHome = d.getElementById('toHome');
const storedFavourites = localStorage.getItem('driversFavoritos');
const favourites = storedFavourites ? JSON.parse(storedFavourites) :  [];

async function fetchData(urlApi){
    const response = await fetch(urlApi);
    const data = await response.json();
    return data;
}

const callFavourites = async() =>{
    let favsApi = driversApi;
    if(favourites.length > 0){
        for(let f of favourites){
            favsApi += `last_name=${f}&`;
        }

        try{
            const driversInfo = await fetchData(favsApi);
            for(let i = 0; i < favourites.length; i++){
                let p = d.createElement('p');
                p.style = 'color: white;'
                p.textContent = driversInfo[i]['country_code'];
                console.log(driversInfo[0])
                favSections.appendChild(p);
            }
            

        } catch(error){
            console.log(error);
        }
    }

}
callFavourites();

const inArray = (array, name) =>{
    return array.includes(name);
}

const defineStyle = (name) =>{
    let favs = JSON.parse(localStorage.getItem('driversFavoritos')) || [];
    return `<i class=" ${inArray(favs, name) ? 'fa-solid' : 'fa-regular'} fa-star"></i>`;
}

const gestionarFavoritos = (nombre) =>{
    let favs = JSON.parse(localStorage.getItem('driversFavoritos')) || [];
    inArray(favs, nombre) ? favs.splice(i => {favs.indexOf(nombre)}, 1) : favs.push(nombre);

    localStorage.setItem('driversFavoritos', JSON.stringify(favs));

    let target = d.getElementById(`fav${nombre}`);
    if(target) {
        target.innerHTML = defineStyle(nombre);
    }
}

// const instanciarFavoritos = () =>{
//     let toTrash = d.querySelectorAll(`.card`);
//     for(let c of toTrash){
//             c.remove();
//     }

//     for(let f of favourites)
// }

btnToHome.addEventListener('click', () =>{
    window.location.href = '../index.html';
});