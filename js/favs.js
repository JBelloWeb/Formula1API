const overallAPI = 'https://api.openf1.org/v1/championship_drivers?';
const driversApi = 'https://api.openf1.org/v1/drivers?';

const flagApi = "https://flagcdn.com/16x12/";

const flagCode = {
    'ARG': 'ar',
    'ESP': 'es',
    'NED': 'nl',
    'FRA': 'fr',
    'USA': 'us',
    'GBR': 'gb_eng',
    'MEX': 'mx',
    'MON': 'mc',
    'DEN': 'dk',
    'JPN': 'jp',
    'CHN': 'cn',
    'GER': 'de',
    'AUS': 'au',
    'THA': 'th',
    'CAN': 'ca',
    'FIN': 'fi',
    'ITA': 'it',
    'NZL': 'nz',
    'BRA': 'br'
};

const d = document;
const favSections = d.getElementById('favSection');
const btnToHome = d.getElementById('toHome');
const storedFavourites = localStorage.getItem('driversFavoritos');
const favourites = storedFavourites ? JSON.parse(storedFavourites) :  [];
const drivers = [];
const loader = d.querySelector('.loader')
const btnRedirect = d.getElementById('btnRedirect');
const errorReporter = d.getElementById('listaVacia');

class driver {
    name = ''
    #number = 0
    scuderias = []
    country = ''
    races = []
    picture = ''
    
    constructor(name, scuderias = [], country, meetingKeys = [], picture){
        this.name = name;
        this.scuderias = scuderias;
        this.country = country;
        this.races = meetingKeys;
        this.picture = picture;
    }
    
    set setNum(num){
        this.#number = num;
    }
    
    get getNum(){
        return this.#number;
    }
}


const feedbackManager = (target, turnOn) => {
    switch (turnOn){
        case true:
            if(target.classList.contains('d-none')) target.classList.remove('d-none');
            break;

        case false:
            if(!(target.classList.contains('d-none'))) target.classList.add('d-none');
            break;
        
        default:
            break;
    }
}

async function fetchData(urlApi){
    const response = await fetch(urlApi);
    const data = await response.json();
    return data;
}

const callFavourites = async() =>{
    let favsApi = driversApi;
    feedbackManager(loader, true);

    if(favourites.length > 0){
        for(let f of favourites){
            favsApi += `last_name=${f}&`;
        }

        try{
            const driversInfo = await fetchData(favsApi);
            const groupedDrivers = {};

            for(let info of driversInfo){
                let name = info.last_name;
                let team = info.team_name.toLowerCase();
                let race = info.meeting_key;

                if(!groupedDrivers[name]) {
                    groupedDrivers[name] = new driver(
                        name,
                        [team],
                        info.country_code,
                        [race],
                        info.headshot_url
                    );
                    groupedDrivers[name].setNum = info.driver_number;
                }else{
                    if (!groupedDrivers[name].scuderias.includes(team)) {
                        groupedDrivers[name].scuderias.push(team);
                    }
                    if (!groupedDrivers[name].races.includes(race)) {
                        groupedDrivers[name].races.push(race);
                    }
                }
            }

            drivers.push(...Object.values(groupedDrivers));



            for (let dr of Object.values(groupedDrivers)) {
                let div = d.createElement('div');
                div.classList='card-fav';

                let header = d.createElement('h2');
                header.innerHTML = dr.name;
                
                let figure = d.createElement('figure');
                let img = d.createElement('img');
                img.src = dr.picture ? dr.picture : 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers';
                figure.appendChild(img);

                let fav = d.createElement('button');
                fav.classList = 'fav';
                fav.id = `fav${dr.name}`;
                fav.innerHTML = defineStyle(dr.name);
                fav.addEventListener('click', () => gestionarFavoritos(dr.name));

                let pais = d.createElement('div');
                pais.id = `country${dr.name}`;
                pais.classList = 'country-tag';
                
                let nameCountry = d.createElement('h3');
                let flag = d.createElement('img');
                nameCountry.innerHTML = dr.country ? dr.country : (dr.name === 'Bortoleto' ? 'BRA' : 'No Registry');
                flag.src = `https://flagcdn.com/16x12/${flagCode[dr.country] ? flagCode[dr.country] : (dr.name === 'Bortoleto' ? 'br' : 'un')}.png`;
                
                pais.appendChild(nameCountry);
                pais.appendChild(flag);

                let history = d.createElement('p');
                history.id = `history${dr.name}`;
                history.innerHTML = `Equipos: ${dr.scuderias.join(',  ')}`; 

                let carreras = d.createElement('h3');
                carreras.id = `races${dr.name}`; 
                carreras.textContent = `Carreras -> ${dr.races.length}`;

                div.appendChild(fav);
                div.appendChild(header);
                div.appendChild(figure);
                div.appendChild(pais);
                div.appendChild(history);
                div.appendChild(carreras);
                
                favSections.appendChild(div);
            }
        } catch(error){
            console.log(error);
        }
    }
    else{
        feedbackManager(errorReporter, true);
    }
    
    feedbackManager(loader, false);
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
    inArray(favs, nombre) ? favs.splice(favs.indexOf(nombre), 1) : favs.push(nombre);

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

function Redirect() {
    window.location.href = '../index.html';
}

btnToHome.addEventListener('click', () =>{
    Redirect()
});
btnRedirect.addEventListener('click', () =>{
    Redirect()
});