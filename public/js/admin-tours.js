import { showAlert } from './alerts.js'; // importo la función showAlert para mostrar mensajes al usuario

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form.form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Formulario enviado');
            const formData = new FormData(form);

            // Convierte startDates a array de fechas completas
            const startDates = formData.get('startDates');
            if (startDates) {
                formData.delete('startDates');
                startDates.split(',').map(d => d.trim()).forEach(date => {
                    if (date) formData.append('startDates', date);
                });
            }

            // Convierte guides a array de IDs
            const guidesSelected = form.querySelector('select[name="guides"]');
            if (guidesSelected) {
                formData.delete('guides');
                Array.from(guidesSelected.selectedOptions).forEach(option => {
                    formData.append('guides', option.value);
                });
            }

            try {
                const res = await fetch('/api/v1/tours', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (res.ok) {
                    showAlert('success', 'Tour añadido correctamente');
                    window.setTimeout(() => {
                        location.assign('/admin-tours'); // redirigir a la página de inicio
                    }, 1500); // 1.5 segundos
                } else {
                    alert(data.message || 'Error al añadir el tour');
                }
            } catch (err) {
                alert('Error de red');
            }
        });
    }

    document.querySelectorAll('.delete-tour').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const tourId = btn.dataset.id;
            if (confirm('¿Seguro que quieres borrar este tour?')) {
                try {
                    const res = await fetch(`/api/v1/tours/${tourId}`, {
                        method: 'DELETE'
                    });
                    if (res.ok) {
                        showAlert('success', 'Tour borrado correctamente');
                        window.setTimeout(() => {
                            location.assign('/admin-tours'); // redirigir a la página de inicio
                        }, 1500); // 1.5 segundos
                    } else {
                        const data = await res.json();
                        alert(data.message || 'Error al borrar el tour');
                    }
                } catch (err) {
                    alert('Error de red');
                }
            }
        });
    });
});