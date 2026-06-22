if('serviceWorker' in navigator){
    window.addEventListener('load', () =>{
        navigator.serviceWorker.register('sw.js')
            .then((registration)=>{
                console.info('ServiceWorker registrado, alcance: '+ registration.scope)
            })
    })
    
}