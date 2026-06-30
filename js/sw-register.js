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
                const noti = new Notification("¡Bienvenido a la parrilla!", {
                    body: "Explorá pilotos, circuitos y resultados de F1",
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

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        notice = event;
        console.log(event);
        showAddToHomeScreen();
    });

    const showAddToHomeScreen = () => {
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) return;
        let showAlert = document.querySelector('#share');
        if (!showAlert) return;
        showAlert.classList.remove('d-none');
        showAlert.addEventListener('click', addToHomeScreen);
    };

    const addToHomeScreen = () =>{
        let showAlert = document.querySelector('#share');
        if (!showAlert) return;
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
    const shareBtn = document.querySelector('#share');
    if (!shareBtn) return;
    shareBtn.addEventListener('click', () => {
        if(navigator.share){
            navigator.share({
                title: 'Formula 1 - PWA',
                text: 'PWA sobre formula 1 compartida',
                url: 'https://'
            })
            .then(() =>{
                shareBtn.classList.add('d-none');
                console.log('se compartio')
            })
            .catch((error) =>{
                console.error(error);
            })
        }
    })
})()