const overallAPI = 'https://api.openf1.org/v1/championship_drivers?session_key=latest&';
const raceAPI = 'https://api.openf1.org/v1/championship_standings?session_name=race&session_key=11234&';

async function fetchData(urlApi){
    const response = await fetch(urlApi);
    const data = await response.json();
    return data;
}

const d = document;
const nav = d.querySelector('.races');
const filter = d.querySelector('.scuderias');
const container = d.querySelector('.container');
const scuderias = [];
const races = ['Australia', 'China', 'Japon']
const drivers = [];

class driver {
    name = ''
    #number = 0
    scuderia = ''
    points = 0
    raceWinner = false

    constructor(name, scuderia, points, winner){
        this.name = name;
        this.scuderia = scuderia;
        this.points = points;
        this.raceWinner = winner;
    }

    set setNum(num){
        this.#number = num;
    }

    get getNum(){
        return this.#number;
    }
}

const getChampionshipInfo = async() =>{
    try{
        const info = await fetchData('https://api.openf1.org/v1/drivers?session_key=latest');
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
                default:
                    team = n.team_name.toLowerCase();
                    break;
            }
            dr.scuderia = team;
            let is = scuderias.includes(n.team_name);
            is == false ? scuderias.push(n.team_name) : console.log(`${n.team_name} ya está registrado`);
            console.log(dr);
            drivers.push(dr);
        }
        instanciarDrivers();
        instanciarScuderias();
    } catch(error){
        console.error(error);
    }
    
}
getChampionshipInfo();

const instanciarDrivers = (scuderia) =>{
    let toTrash = d.querySelectorAll('.card');
    for(let c of toTrash){
        c.remove();
    }

    if(scuderia != undefined){
        let filtered = drivers.filter(d => d.scuderia.toLowerCase() == scuderia.toLowerCase());
        for(let dr of filtered){
            let div = d.createElement('div');
                div.id = dr.getNum;
                div.className = `card ${dr.scuderia}`;
            let header = d.createElement('h2');
                header.innerHTML = dr.name;
            let button = d.createElement('button');
            button.innerHTML = 'Ver info';
            button.addEventListener('click', async () => {
                    let list = d.createElement('ul');
                let li1 = d.createElement('li');
                    const points = await getInfo(dr.getNum, 'points_current');
                    li1.innerHTML = `Puntos: ${points}`;
                let li2 = d.createElement('li');
                    const pos = await getInfo(dr.getNum, 'position_current');
                    li2.innerHTML = `Posición en tabla: ${pos}`;

                list.appendChild(li1);
                list.appendChild(li2);
                div.appendChild(list);
                })

            div.appendChild(header);
            div.appendChild(button);

            

            container.appendChild(div);
    }
    } else{
            for(let dr of drivers){
            let div = d.createElement('div');
                div.id = dr.getNum;
                div.className = `card ${dr.scuderia}`;
            let header = d.createElement('h2');
                header.innerHTML = dr.name;
            let button = d.createElement('button');
            button.innerHTML = 'Ver info';
            button.addEventListener('click', async () => {
                    let list = d.createElement('ul');
                let li1 = d.createElement('li');
                    const points = await getInfo(dr.getNum, 'points_current');
                    li1.innerHTML = `Puntos: ${points}`;
                let li2 = d.createElement('li');
                    const pos = await getInfo(dr.getNum, 'position_current');
                    li2.innerHTML = `Posición en tabla: ${pos}`;

                list.appendChild(li1);
                list.appendChild(li2);
                div.appendChild(list);
                })

            div.appendChild(header);
            div.appendChild(button);

            

            container.appendChild(div);
    }
}}

// const instanciarRaces = () =>{
//     let ul = d.createElement('ul');
//     for(let r of races){
//         let li = d.createElement('li');
//         li.innerHTML = r;
//         li.addEventListener('click', ()=>{
//             instanciarDrivers();
//         })
//         ul.appendChild(li);
//         nav.appendChild(ul);
//     }
// }

// instanciarRaces();

const instanciarScuderias = () =>{
    for(let s of scuderias){
        let li = d.createElement('li');
        li.innerHTML = s;
        li.addEventListener('click', ()=>{
            instanciarDrivers(s);
        })
        filter.appendChild(li);
    }
}

instanciarDrivers();

const getInfo = async (num, mod) =>{

    try{
        let card = d.getElementById(num);
        const data = await fetchData(`${overallAPI}driver_number=${num}`);
        card.classList.add('flip');
        console.log(data);
        return data[0][mod];
    }catch(error){
    console.error(error);
    return 'Error';
}
}

