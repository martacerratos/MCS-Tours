import { showAlert } from './alerts.js';

document.addEventListener('DOMContentLoaded', () => {
    const favBtn = document.querySelector('#favorite-tour');
    if (favBtn) {
        favBtn.addEventListener('click', async e => {
            const tourId = e.target.dataset.tourId;
            try {
                const res = await axios.post(`/api/v1/users/favorite/${tourId}`);
                if (res.data.status === 'success') {
                    favBtn.textContent = 'Añadido a favoritos';
                    showAlert('success', 'Añadido a favoritos correctamente');
                }
            } catch (err) {
                alert('Error al añadir a favoritos');
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn--remove-favorite').forEach(btn => {
        btn.addEventListener('click', async e => {
            const tourId = btn.dataset.tourId;
            try {
                const res = await axios.post(`/api/v1/users/favorite/${tourId}`);
                if (res.data.status === 'success') {
                    btn.closest('.tarjeta').remove();
                    showAlert('success', 'Tour eliminado de favoritos');
                    // Si ya no quedan tarjetas, espera 5 segundos y recarga la página
                    if (document.querySelectorAll('.tarjeta').length === 0) {
                        setTimeout(() => {
                            location.reload();
                        }, 1000);
                    }
                }
            } catch (err) {
                alert('Error al quitar de favoritos');
            }
        });
    });
});