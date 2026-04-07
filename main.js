const overallAPI = 'https://api.openf1.org/v1/championship_drivers?session_key=latest&';
const raceAPI = 'https://api.openf1.org/v1/championship_standings?session_name=race&session_key=11234&';

async function fetchData(urlApi){
    const response = await fetch(urlApi);
    const data = await response.json();
    return data;
}


const oldGetInfo = async (urlApi) =>{
    for(d of drivers){    
            try{
                const data = await fetchData(`${urlApi}driver_number=${d}`)
                console.log(data)
            }
            catch(error){
                console.error(error);
            }
    }
 
}



const d = document;
const nav = d.querySelector('.races');
const filter = d.querySelector('.scuderias');
const container = d.querySelector('.container');

const races = ['Australia', 'China', 'Japon']
const scuderias = ['Ferrari', 'Mclaren', 'RedBull', 'AstonMartin', 'Alpine', 'Audi', 'Cadillac', 'Haas', 'Mercedes', 'Visa', 'Williams'];
const numbers = [1, 3, 5, 6, 10, 11, 12, 14, 16, 18, 23, 27, 30, 31, 41, 43, 44, 55, 63, 77, 81, 87];
const names = ['Norris', 'Verstappen', 'Bortoleto', 'Hadjar', 'Gasly', 'Perez', 'Antonelli', 'Alonso', 'Leclerc', 'Stroll', 'Albon', 'Hulkenberg', 'Lawson', 'Occon', 'Lindblad', 'Colapinto', 'Hamilton', 'Sainz', 'Russel', 'Bottas', 'Piastri', 'Bearman'];
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

let i = 0;
for(let n of numbers){
    let dr = new driver;
    dr.name = names[i];
    dr.setNum = n;

    //Asociar escuderia a cada piloto
     switch(n){
        case 1:
        case 81:
            dr.scuderia = 'mclaren';
            break;
        case 3:
        case 6:
            dr.scuderia = 'redbull';
            break;
        case 5:
        case 27:
            dr.scuderia = 'audi';
            break;
        case 10:
        case 43:
            dr.scuderia = 'alpine';
            break;
        case 11:
        case 77:
            dr.scuderia = 'cadillac';
            break;
        case 12:
        case 63:
            dr.scuderia = 'mercedes';
            break;
        case 14:
        case 18:
            dr.scuderia = 'astonmartin';
            break;
        case 16:
        case 44:
            dr.scuderia = 'ferrari';
            break;
        case 23:
        case 55:
            dr.scuderia = 'williams';
            break;
        case 30:
        case 41:
            dr.scuderia = 'visa';
            break;
        case 31:
        case 87:
            dr.scuderia = 'haas';
            break;
        default:
            break;
     }

    drivers.push(dr);
    i++;
}


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

instanciarScuderias();

instanciarDrivers();

oldGetInfo(overallAPI);

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

