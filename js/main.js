const overallAPI = 'https://api.openf1.org/v1/championship_drivers?';

const d = document;
const nav = d.querySelector('.races');
const filter = d.querySelector('.teams');
const container = d.querySelector('.container');
const scuderias = [];
const drivers = [];
const storedFavourites = localStorage.getItem('driversFavoritos');
const favourites = storedFavourites ? JSON.parse(storedFavourites) :  [];
const year = d.getElementById('yearSelector');
const race = d.getElementById('raceSelector');
const btnToFavs = d.getElementById('toFavs');
const loader = d.querySelector('.loader');
const errorReporter = d.getElementById('noConection');
const btnRetry = d.getElementById('btnRetry');

class driver {
    name = ''
    #number = 0
    scuderia = ''
    points = 0
    color = ''
    picture = ''
    
    constructor(name, scuderia, points, color, picture){
        this.name = name;
        this.scuderia = scuderia;
        this.points = points;
        this.color = color;
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
    
    if(response.status === 429){
        await new Promise(resolve => setTimeout(resolve, 10000));
        return fetchData(urlApi);
    }
    
    const data = await response.json();
    return data;
}

const getSessionKey = async () =>{
    try{
        const data = await fetchData(`https://api.openf1.org/v1/sessions?country_name=${race.value}&year=${year.value}`);
        let session = data[data.length - 1];
        let key = session.session_key;
        return key;   
    }catch(error){
        console.error(error);
        feedbackManager(loader, false);
        feedbackManager(errorReporter, true);
}}

const getChampionshipInfo = async() =>{
    let list = d.querySelectorAll('.teams_container');
    for(let l of list){
        l.remove();
    }
    let cleanTeams = d.querySelectorAll('.team');
    let cleanDrivers = d.querySelectorAll('.card');
    for(let c of cleanTeams){
        c.remove();
    }
    for(let c of cleanDrivers){
        c.remove();
    }
    drivers.splice(0, drivers.length);
    scuderias.splice(0, scuderias.length);

    feedbackManager(loader, true);


    try{
        const key = await getSessionKey();
        const info = await fetchData(`https://api.openf1.org/v1/drivers?session_key= ${key}`);
        for(let n of info){
            let dr = new driver;
            dr.name = n.last_name;
            dr.setNum = n.driver_number;
            let team;
            switch(n.team_name){
                case "Red Bull Racing":
                    team = "redbull"
                    break;
                    case "Racing Bulls":
                        team = "visa";
                        break;
                    case "Aston Martin":
                        team = "astonmartin";
                        break;
                    case "Haas F1 Team":
                        team = "haas";
                        break;
                    case "Alfa Romeo":
                        team = "alfaromeo";
                    default:
                    team = n.team_name.toLowerCase();
                    break;
            }
            dr.scuderia = team;
            dr.color = n.team_colour;
            dr.picture = n.headshot_url;
            let is = scuderias.includes(team.toUpperCase());
            
            if(!is) scuderias.push(team.toUpperCase());
            drivers.push(dr);
        }
        instanciarDrivers();
        instanciarScuderias();
    } catch(error){
        console.error(error);
        feedbackManager(loader, false);
        feedbackManager(errorReporter, true);
    }
    
}
getChampionshipInfo();

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

const instanciarDrivers = (scuderia) =>{
    let toTrash = d.querySelectorAll(`.card`);
    for(let c of toTrash){
            c.remove();
    }


    for(let dr of drivers){
               let div = d.createElement('div');
               div.id = dr.getNum;
               div.className = `card ${dr.scuderia}`;
               div.style.setProperty(`--main-color`,` #${dr.color}`)
               div.style.setProperty(`--secondary-color`,`hsl(from var(--main-color) calc(h + 180) 10 15)`)

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

               let button = d.createElement('button');
               button.classList = 'info';
               button.innerHTML = 'Ver info';
               button.addEventListener('click', async () => {
                    button.disabled = true;
                    if(!(button.classList.contains('diabled'))){
                    button.classList.add('disabled');
                    let cardLoader = d.createElement('div');
                        cardLoader.className = 'card-loader';
                        cardLoader.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                        div.appendChild(cardLoader);

                        try{
                            let list = d.createElement('ul');
                       
                            let li1 = d.createElement('li');
                            let points = await getInfo(dr.getNum, 'points_current');

                            if (points === "null" || points === null) {
                                points = '0';
                            }
                            li1.innerHTML = `Puntos: ${points}`;
                            
                            let li2 = d.createElement('li');
                            const pos = await getInfo(dr.getNum, 'position_current');
                            li2.innerHTML = `Posición en tabla: ${pos}`;

                            list.appendChild(li1);
                            list.appendChild(li2);

                            cardLoader.remove();
                            button.remove();

                            div.appendChild(list);
                        } catch (error) {
                            console.error("Error obteniendo la información", error);
                            cardLoader.innerHTML = 'Error al cargar info. Reintenta.';
                            button.disabled = false;
                        }
            }})

            feedbackManager(loader, false)

            figure.appendChild(img);
            div.appendChild(fav);
            div.appendChild(header);
            div.appendChild(figure);
            div.appendChild(button);
            container.appendChild(div);
        }
}
                
const instanciarScuderias = () =>{
    let ul = d.createElement('ul');
    ul.className = "teams_container";
    for(let s of scuderias){
        let li = d.createElement('li');
        li.className ="team";
        li.innerHTML = s;
        li.addEventListener('click', ()=>{
            filterDrivers(s);
        })
        ul.appendChild(li);
    }
    filter.appendChild(ul);
}

const filterDrivers = (scuderia) =>{
    let hide = d.querySelectorAll(`.card`);
    
    for(let c of hide){
        c.classList.remove("hide")
        if(c.className !== `card ${scuderia.toLowerCase()}`) {
            c.classList.add("hide");
    }
}}


instanciarDrivers();


const getInfo = async (num, mod) =>{
    try{
        const r = await getSessionKey();
        let card = d.getElementById(num);
        const data = await fetchData(`${overallAPI}session_key=${r}&driver_number=${num}`);
        card.classList.add('flip');
        console.log(data);
        return data[0][mod];
    }catch(error){
        console.error(error);
        feedbackManager(loader, false);
        feedbackManager(errorReporter, true);
        return 'Error';
    }
}
race.addEventListener('change', ()=>{
    instanciarDrivers();
    let options = year.querySelectorAll('option');
    if(!(race.value == 'China' || race.value == 'Australia' || race.value == 'Japan')){
        options.forEach(y =>{
            if(y.value == '2026') y.disabled = true;
        })
    } else{
        options.forEach(o => {
            o.disabled = false;
        });
    }
})

year.addEventListener('change', () =>{
    let options = race.querySelectorAll('option');
    if(year.value == '2026'){
        options.forEach(o => {
            if(!(o.value == 'China' || o.value == 'Australia' || o.value == 'Japan')) o.disabled = true;
        });
    }else{
        options.forEach(o => {
            o.disabled = false;
        });
    }
    getChampionshipInfo();
})

btnToFavs.addEventListener('click', () =>{
window.location.href = 'pages/favourites.html';
});

btnRetry.addEventListener('click', () =>{
    window.location.reload();
})