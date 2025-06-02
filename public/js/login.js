import { showAlert } from './alerts.js'; // importo la función showAlert para mostrar mensajes al usuario

const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login', // url que tengo en el login de Postman
            data: { // lo que le voy a enviar al servidor
                email,
                password
            },
            withCredentials: true // le digo que envie las cookies
        });

        if (res.data.status === 'success') { // si la respuesta es exitosa
            // Mostrar un mensaje de éxito al usuario
            showAlert('success', 'Inicio exitoso!');
            window.setTimeout(() => {
                location.assign('/'); // redirigir a la página de inicio
            }, 1500); // 1.5 segundos
        }
    } catch (err) {
        showAlert('error', err.response.data.message); // si hay un error, lo muestro en un alert
    }
};




const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout', // url que tengo en el logout de Postman
        });

        if (res.data.status === 'success') {
            window.location.assign('/'); // Redirige a la página principal
        }
    } catch (err) {
        showAlert('error', 'Error al salir! Intentalo de nuevo.'); // si hay un error, lo muestro en un alert
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.querySelector('#email').value; // cojo el valor introducido en el campo de email
            const password = document.querySelector('#password').value; // cojo el valor introducido en el campo de password
            login(email, password); // llamo a la función login y le paso los valores de email y password
        });
    }
});

// AÑADO FUNCION DE LOGOUT A SU BOTON
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.querySelector('.nav-el-logout'); // selecciono el boton de logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout); // llamo a la funcion logout al hacer click en el boton
    }
});

