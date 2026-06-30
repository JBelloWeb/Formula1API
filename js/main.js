import { animate, svg } from 'animejs';

const overallAPI = 'https://api.openf1.org/v1/championship_drivers?';

const d = document;
const filter = d.querySelector('.teams');
const container = d.querySelector('.container');
const gallery = d.getElementById('circuit-gallery');
const hero = d.getElementById('circuit-hero');
const scuderias = [];
const drivers = [];
const storedFavourites = localStorage.getItem('driversFavoritos');
const favourites = storedFavourites ? JSON.parse(storedFavourites) :  [];
const year = d.getElementById('yearSelector');
const btnToFavs = d.getElementById('toFavs');
const loader = d.querySelector('.loader');
const errorReporter = d.getElementById('noConection');
const btnRetry = d.getElementById('btnRetry');

let selectedMeetingKey = null;
let circuitsData = {};
let heroCarAnim = null;
let heroDrawAnim = null;
let heroObserver = null;

const LS_DRIVERS_KEY = 'driversData';
const LS_SESSIONS_KEY = 'sessionsCache_v2';

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

const saveToLocalStorage = () =>{
    const data = drivers.map(d => ({
        name: d.name,
        number: d.getNum,
        scuderia: d.scuderia,
        points: d.points,
        color: d.color,
        picture: d.picture
    }));

    localStorage.setItem(LS_DRIVERS_KEY, JSON.stringify({ drivers: data, scuderias }));
};

const loadFromLocalStorage = () => {
    const stored = localStorage.getItem(LS_DRIVERS_KEY);
    if(!stored) return false;
    const { drivers: data, scuderias: teams } = JSON.parse(stored);
    drivers.length = 0;
    for (const d of data) {
        const dr = new driver();
        dr.name = d.name;
        dr.setNum = d.number;
        dr.scuderia = d.scuderia;
        dr.points = d.points;
        dr.color = d.color;
        dr.picture = d.picture;
        drivers.push(dr);
    }
    scuderias.push(...teams);
    return true;
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

const fetchSessions = async (year) => {
    const cached = localStorage.getItem(`${LS_SESSIONS_KEY}_${year}`);
    if (cached) return JSON.parse(cached);

    const data = await fetchData(`https://api.openf1.org/v1/sessions?year=${year}`);

    const races = data
        .filter(s => s.session_type === 'Race' && s.session_name === 'Race')
        .sort((a, b) => new Date(a.date_start) - new Date(b.date_start))
        .map(s => ({
            meeting_key: s.meeting_key,
            country_name: s.country_name,
            circuit_short_name: s.circuit_short_name,
            location: s.location,
            session_key: s.session_key,
            date_start: s.date_start,
            is_cancelled: s.is_cancelled
        }));

    localStorage.setItem(`${LS_SESSIONS_KEY}_${year}`, JSON.stringify(races));
    return races;
};

const loadCircuits = async () => {
    try {
        const resp = await fetch('assets/circuits.json');
        circuitsData = await resp.json();
    } catch (e) {
        console.warn('No se pudo cargar circuits.json', e);
    }
};

const renderCircuitGallery = (sessions) => {
    gallery.innerHTML = '';
    const now = new Date();

    for (const s of sessions) {
        const card = d.createElement('div');
        card.className = 'gp-card';
        card.dataset.meetingKey = s.meeting_key;

        const isFuture = new Date(s.date_start) > now;
        const isCancelled = s.is_cancelled;

        if (isCancelled || isFuture) {
            card.classList.add('disabled');
        }

        const svgWrapper = d.createElement('div');
        svgWrapper.className = 'gp-circuit-svg';
        const pathD = circuitsData[s.circuit_short_name];
        if (pathD) {
            svgWrapper.innerHTML = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"><path class="gp-base-path" d="${pathD}"/><path class="gp-draw-path" d="${pathD}"/><circle class="gp-car" r="15" fill="#e4a63a" stroke="#fefefe" stroke-width="2"/></svg>`;
        }

        const info = d.createElement('div');
        info.className = 'gp-info';
        info.innerHTML = `
            <span class="gp-country">${s.country_name}</span>
            <span class="gp-circuit-name">${s.circuit_short_name}</span>
            ${isCancelled ? '<span class="gp-badge cancelled">Cancelada</span>' : ''}
            ${isFuture ? '<span class="gp-badge future">Próximamente</span>' : ''}
        `;

        card.appendChild(svgWrapper);
        card.appendChild(info);

        if (!isCancelled && !isFuture) {
            const pathEl = svgWrapper.querySelector('.gp-draw-path');
            const carEl = svgWrapper.querySelector('.gp-car');
            let hoverAnim = null;
            let hoverDrawAnim = null;

            card.addEventListener('mouseenter', () => {
                if (hoverAnim) {
                    hoverAnim.play();
                    hoverDrawAnim.play();
                } else {
                    hoverAnim = animate(carEl, {
                        ...svg.createMotionPath(pathEl),
                        duration: 3000,
                        loop: true,
                        ease: 'linear'
                    });
                    hoverDrawAnim = animate(svg.createDrawable(pathEl), {
                        draw: ['0 0', '0 1'],
                        duration: 3000,
                        loop: true,
                        ease: 'linear'
                    });
                }
            });

            card.addEventListener('mouseleave', () => {
                if (hoverAnim) hoverAnim.pause();
                if (hoverDrawAnim) hoverDrawAnim.pause();
            });

            card.addEventListener('click', () => {
                d.querySelectorAll('.gp-card.selected').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedMeetingKey = s.meeting_key;
                gallery.classList.add('collapsed');
                d.querySelector('.gp-back-btn').classList.remove('d-none');
                showCircuitHero(s.circuit_short_name);
                getChampionshipInfo();
            });
        }

        gallery.appendChild(card);
    }
};

const clearCircuitHero = () => {
    if (heroObserver) heroObserver.disconnect();
    if (heroCarAnim && typeof heroCarAnim.cancel === 'function') heroCarAnim.cancel();
    if (heroDrawAnim && typeof heroDrawAnim.cancel === 'function') heroDrawAnim.cancel();
    heroObserver = null;
    heroCarAnim = null;
    heroDrawAnim = null;
    hero.innerHTML = '';
    hero.classList.add('d-none');
    document.getElementById('race-layout').classList.remove('split');
};

const showCircuitHero = (circuitName) => {
    clearCircuitHero();
    const pathD = circuitsData[circuitName];
    if (!pathD) return;

    hero.innerHTML = `
        <div class="hero-panel">
            <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                <path class="hero-base-path" d="${pathD}" />
                <path class="hero-draw-path" d="${pathD}" />
                <circle class="hero-car" r="14" />
            </svg>
            <span class="hero-circuit-name">${circuitName}</span>
        </div>
    `;
    hero.classList.remove('d-none');
    document.getElementById('race-layout').classList.add('split');

    const drawPath = hero.querySelector('.hero-draw-path');

    heroDrawAnim = animate(svg.createDrawable(drawPath), {
        draw: ['0 0', '0 1'],
        duration: 5500,
        ease: 'linear'
    });

    heroCarAnim = animate(hero.querySelector('.hero-car'), {
        ...svg.createMotionPath(drawPath),
        duration: 5500,
        loop: true,
        ease: 'linear'
    });

    heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => e.target.classList.toggle('hero-dimmed', !e.isIntersecting));
    }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] });
    heroObserver.observe(hero);
};

const getSessionKey = async (meetingKey) => {
    if (!meetingKey) meetingKey = selectedMeetingKey;

    const cached = localStorage.getItem(`${LS_SESSIONS_KEY}_${year.value}`);
    if (cached) {
        const sessions = JSON.parse(cached);
        const found = sessions.find(s => s.meeting_key === meetingKey);
        if (found?.session_key) return found.session_key;
    }

    try {
        const data = await fetchData(`https://api.openf1.org/v1/sessions?meeting_key=${meetingKey}&session_type=Race&session_name=Race`);
        return data[0]?.session_key;
    } catch(error) {
        console.error(error);
        feedbackManager(loader, false);
        feedbackManager(errorReporter, true);
    }
};

const getChampionshipInfo = async() =>{
    if (!selectedMeetingKey) return;
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
        const info = await fetchData(`https://api.openf1.org/v1/drivers?session_key=${key}`);
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

(async () => {
    await loadCircuits();
    const sessions = await fetchSessions(year.value);
    renderCircuitGallery(sessions);

    feedbackManager(loader, false);

    if(loadFromLocalStorage()) {
        instanciarDrivers();
        instanciarScuderias();
    }
})();

d.querySelector('.gp-back-btn').addEventListener('click', () => {
    gallery.classList.remove('collapsed');
    d.querySelector('.gp-back-btn').classList.add('d-none');
    clearCircuitHero();
});

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
    localStorage.removeItem('favsData'); // invalidar cache de detalles de favoritos

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
                    if(!(button.classList.contains('disabled'))){
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
                            feedbackManager(errorReporter, true);
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
year.addEventListener('change', async () => {
    selectedMeetingKey = null;
    gallery.classList.remove('collapsed');
    d.querySelector('.gp-back-btn').classList.add('d-none');
    clearCircuitHero();
    const sessions = await fetchSessions(year.value);
    renderCircuitGallery(sessions);
    let list = d.querySelectorAll('.teams_container');
    for(let l of list) l.remove();
    let cleanTeams = d.querySelectorAll('.team');
    let cleanDrivers = d.querySelectorAll('.card');
    for(let c of cleanTeams) c.remove();
    for(let c of cleanDrivers) c.remove();
    drivers.splice(0, drivers.length);
    scuderias.splice(0, scuderias.length);
})

btnToFavs.addEventListener('click', () =>{
window.location.href = 'pages/favourites.html';
});

btnRetry.addEventListener('click', () =>{
    window.location.reload();
});

const alertEl = document.getElementById('add-alert');

function updateOnlineStatus() {
    if (navigator.onLine) {
        alertEl.textContent = 'Online';
        alertEl.className = 'online';
    } else {
        alertEl.textContent = 'Sin conexión — los datos pueden no estar actualizados';
        alertEl.className = 'offline';
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();