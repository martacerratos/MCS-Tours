export const hideAlert = () => {
    const alert = document.querySelector('.alert'); // selecciono el elemento con la clase alert
    if (alert) alert.parentElement.removeChild(alert); // si existe, lo elimino del DOM
}

export const showAlert = (type, message) => {
    hideAlert(); // llamo a la función hideAlert para eliminar cualquier alerta existente
    const markup = `<div class="alert alert--${type}">${message}</div>`; 
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup); // inserto el mensaje en el body de la página
    window.setTimeout(hideAlert, 5000); // llamo a la función hideAlert después de 5 segundos para eliminar la alerta
}

