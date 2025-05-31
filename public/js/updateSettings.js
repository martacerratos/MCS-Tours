import { showAlert } from './alerts.js'; // importo la función showAlert para mostrar mensajes al usuario

// Actualizar nombre y email o contraseña
const updateSettings = async (data, type) => {
    try {
        const url = type === 'password' // si el tipo es password
            ? '/api/v1/users/updateMyPassword' // actualiza la contraseña
            : '/api/v1/users/updateMe'; // sino, actualiza nombre y email

        const res = await axios({
            method: 'PATCH',
            url,
            data
        });

        if (res.data.status === 'success') { // si la respuesta es exitosa
            showAlert('success', 'Datos actualizados correctamente!'); // muestro un mensaje de éxito al usuario
            location.reload(); // recarga de la página
        }
    } catch (err) {
        showAlert('error', err.response.data.message); // si hay un error, lo muestro en un alert
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const userDataForm = document.querySelector('.form-user-data');
    const userPasswordForm = document.querySelector('.form-user-password');
    if (userDataForm) {
        userDataForm.addEventListener('submit', e => {
            e.preventDefault();
            const form = new FormData(); // creo un nuevo objeto FormData
            form.append('name', document.querySelector('#name').value); // cojo el valor introducido en el campo de name
            form.append('email', document.querySelector('#email').value); // cojo el valor introducido en el campo de email
            form.append('photo', document.querySelector('input[name="photo"]').files[0]); // cojo el valor introducido en el campo de photo

            updateSettings(form, 'data'); // llamo a la función updateData y le paso los valores 
        });
    }
    if (userPasswordForm) {
        userPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const passwordCurrent = document.querySelector('#password-current').value;
            const password = document.querySelector('#password').value;
            const passwordConfirm = document.querySelector('#password-confirm').value;

            // llamo a la función updateData y le paso los valores (tienen que ser los mismos que en el servidor)
            // se usa await para esperar que la funcion termine antes de borrar los campos
            await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');

            // limpio los campos del formulario
            document.querySelector('#password-current').value = '';
            document.querySelector('#password').value = '';
            document.querySelector('#password-confirm').value = '';
        });
    };
});

