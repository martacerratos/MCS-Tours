import { showAlert } from './alerts.js';

const signup = async (name, email, password, passwordConfirm) => {
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/signup',
            data: { name, email, password, passwordConfirm }
        });

        if (res.data.status === 'success') {
            showAlert('success', '¡Registro exitoso!');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#form-signup');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const name = document.querySelector('#name').value;
            const email = document.querySelector('#email').value;
            const password = document.querySelector('#password').value;
            const passwordConfirm = document.querySelector('#passwordConfirm').value;
            signup(name, email, password, passwordConfirm);
        });
    }
});