const overallAPI = 'https://api.openf1.org/v1/championship_drivers?';
const driversApi = 'https://api.openf1.org/v1/drivers?';

const d = document;
const favSections = d.getElementById('favSection');
const btnToHome = d.getElementById('toHome');
const storedFavourites = localStorage.getItem('driversFavoritos');
const favourites = storedFavourites ? JSON.parse(storedFavourites) :  [];
const drivers = [];
const loader = d.querySelector('.loader')

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

async function fetchData(urlApi){
    const response = await fetch(urlApi);
    const data = await response.json();
    return data;
}

const callFavourites = async() =>{
    let favsApi = driversApi;

     loader.classList.remove('d-none');

    
    if(favourites.length > 0){
        for(let f of favourites){
            favsApi += `last_name=${f}&`;
        }
        
        let founds = [];
        let i = 0;

        try{
            const driversInfo = await fetchData(favsApi);
            while(founds.length < favourites.length){

                let currentDriver =  driversInfo[i];

                if(inArray(founds, currentDriver.last_name)){
                    let drIndex = drivers.findIndex(d => d.name === currentDriver.last_name);
                    if(!inArray(drivers[drIndex].races, currentDriver.meeting_key)){
                        drivers[drIndex].races.push(currentDriver.meeting_key)
                    }
                    i++;
                } else{
                    founds.push(currentDriver.last_name);

                    let dr = new driver;
                    dr.name = currentDriver.last_name;
                    dr.setNum = currentDriver.driver_number;

                    let team = currentDriver.team_name.toLowerCase();

                    if(!inArray(dr.scuderias, team)){
                        dr.scuderias.push(team);  
                    } 
                    dr.picture = currentDriver.headshot_url;
                    drivers.push(dr);
                    
                    let div = d.createElement('div');
                    div.classList='card-fav';

                    let header = d.createElement('h2');
                    header.innerHTML = dr.name;
                    let figure = d.createElement('figure');
                    let img = d.createElement('img');
                    img.src= dr.picture;

                    let fav = d.createElement('button');
                    fav.classList = 'fav';
                    fav.id = `fav${dr.name}`;
                    fav.innerHTML = defineStyle(dr.name);
                        
                    fav.addEventListener('click', () =>{
                            gestionarFavoritos(dr.name)
                    });

                    figure.appendChild(img);
                    div.appendChild(fav);
                    div.appendChild(header);
                    div.appendChild(figure);
                    favSections.appendChild(div);
                    i++;     
                }
            }
            console.log(drivers);
            loader.classList.add('d-none');

            

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