if('serviceWorker' in navigator){
    window.addEventListener('load', () =>{
        navigator.serviceWorker.register('sw.js')
            .then((registration)=>{
                console.info('ServiceWorker registrado, alcance: '+ registration.scope)
            })
    })

    if(window.Notification){
        Notification.requestPermission().then((perimission) =>{
            if(perimission === 'granted'){
                const noti = new Notification("Aquí va el titulo", {
                    body: "Soy una notificación local",
                    icon: 'favicon.ico',
                });
            } else {
                console.log('El usuario denegó los permisos para notificaciones');
            }
        });
    }    
}

(() => {
    let notice;

    window.addEventListener('beforeInstallprompt', (event) => {
        event.preventDefault();
        notice = event;
        console.log(event);
        showAddToHomeScreen();
    });

    const showAddToHomeScreen = () => {
        let showAlert = document.querySelector('#add-alert');
        showAlert.classList.remove('d-none');
        showAlert.addEventListener('click', addToHomeScreen);
    };

    const addToHomeScreen = () =>{
        let showAlert = document.querySelector('#add-alert');
        showAlert.classList.add('d-none');

        if(notice){
            notice.prompt();
            notice.userChoice
                .then((choiceResult) =>{
                    if(choiceResult.outcome === 'accepted'){
                        console.log('el usuario acepto');
                    } else {
                        console.log('el usuario no acepto')
                    }

                    notice = null;
                })
        }
    }
})();

(()=>{
    document.querySelector('#share').addEventListener('click', () => {
        if(navigator.share){
            navigator.share({
                title: 'Formula 1 - PWA',
                text: 'PWA sobre formula 1 compartida',
                url: 'https://'
            })
            .then(() =>{
                console.log('se compartio')
            })
            .catch((error) =>{
                console.error(error);
            })
        }
    })
})()