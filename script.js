document.addEventListener('DOMContentLoaded', function () {
    const gasForm = document.getElementById('gas-form');
    const formContainer = document.getElementById('form-container');
    const summaryOverlay = document.getElementById('summary-overlay');
    const summaryContent = document.getElementById('summary-content');
    const modifyBtn = document.getElementById('modify-btn');
    const acceptBtn = document.getElementById('accept-btn');

    // Asigna la fecha actual al campo de fecha
    document.getElementById('fecha').valueAsDate = new Date();

    gasForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = new FormData(gasForm);
        const data = Object.fromEntries(formData.entries());

        let summaryHTML = `
            <h2>📄 Resumen del Recibo</h2>
            <p><strong>Fecha:</strong> ${data.fecha}</p>
            <p><strong>Cliente:</strong> ${data.cliente}</p>
            <p><strong>Dirección:</strong> ${data.direccion}</p>
            <p><strong>Teléfono:</strong> ${data.telefono}</p>
            <h3>Cilindros Recogidos:</h3>`;

        let totalCilindros = 0;
        const cilindros = {
            'Cil. 10K': data['cil-10k'],
            'Cil. 18K': data['cil-18k'],
            'Cil. 27K': data['cil-27k'],
            'Cil. 43K': data['cil-43k'],
        };

        let cilindrosResumen = '';
        for (const [key, value] of Object.entries(cilindros)) {
            if (parseInt(value, 10) > 0) {
                cilindrosResumen += `<p><strong>${key}:</strong> ${value} unidad(es)</p>`;
                totalCilindros += parseInt(value, 10);
            }
        }

        if (totalCilindros === 0) {
            alert("Por favor, ingrese la cantidad para al menos un tipo de cilindro.");
            return;
        }

        summaryHTML += cilindrosResumen || "<p>No se recogieron cilindros.</p>";
        summaryContent.innerHTML = summaryHTML;

        formContainer.classList.add('hidden');
        summaryOverlay.classList.remove('hidden');
    });

    modifyBtn.addEventListener('click', function () {
        summaryOverlay.classList.add('hidden');
        formContainer.classList.remove('hidden');
    });

    acceptBtn.addEventListener('click', function () {
        this.disabled = true;
        this.textContent = 'Procesando...';

        // 1. Enviar datos a Google Sheets
        sendDataToSheet();

        // 2. Generar imagen y descargar
        html2canvas(document.getElementById('summary-content'), {
            backgroundColor: '#F5F5DC' // Fondo beige para la imagen
        }).then(canvas => {
            const link = document.createElement('a');
            const cliente = document.getElementById('cliente').value.replace(/ /g, '_');
            const fecha = document.getElementById('fecha').value;
            link.download = `Recibo_${cliente}_${fecha}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Restablecer el formulario y botones después de un momento
            setTimeout(() => {
                alert("Recibo guardado y datos enviados correctamente.");
                gasForm.reset();
                document.getElementById('fecha').valueAsDate = new Date(); // Resetear fecha
                summaryOverlay.classList.add('hidden');
                formContainer.classList.remove('hidden');
                this.disabled = false;
                this.textContent = 'Aceptar y Guardar';
            }, 500);
        }).catch(err => {
            console.error('Error al generar la imagen:', err);
            alert('Hubo un error al generar la imagen del recibo.');
            this.disabled = false;
            this.textContent = 'Aceptar y Guardar';
        });
    });

    function sendDataToSheet() {
        const scriptURL = 'https://script.google.com/macros/s/AKfycbwA_grLxZohVYI3oW2TZkL3UKjGLYq1vycg3mKzBlqdwP-GltfmtGg7YJHFhVHnWEQCiw/exec'; // <-- REEMPLAZA ESTA URL
        const formData = new FormData(gasForm);
        // Añadir la fecha y hora de registro para el backend
        formData.append('timestamp', new Date().toLocaleString('es-VE'));

        fetch(scriptURL, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                  console.error('Error en la respuesta de Google Sheets');
                }
                return response.json();
            })
            .then(data => {
                console.log('Éxito:', data);
            })
            .catch(error => {
                console.error('Error al enviar a Google Sheets:', error.message);
                alert("Hubo un error al enviar los datos. Revisa la consola para más detalles.");
            });
    }
});