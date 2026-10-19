// Guardar nuevo medicamento en Supabase y enviar notificación a Telegram
if (formulario) {
  formulario.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Función auxiliar para obtener valores de inputs probando varios IDs posibles
    const obtenerValor = (ids) => {
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.value.trim() !== '') return el.value.trim();
      }
      return '';
    };

    // Lectura de campos con fallbacks de IDs comunes
    const nombreVal = obtenerValor(['nombre', 'producto', 'nombreMedicamento', 'medicamento']);
    const tipoVal = obtenerValor(['tipo', 'categoria']) || 'medicamento';
    const dosisVal = obtenerValor(['dosis', 'dosisAplicacion']);
    const momentoVal = obtenerValor(['momento', 'horario']);
    const horaVal = obtenerValor(['hora', 'horaEspecifica']);
    const diasVal = obtenerValor(['dias', 'diasUso', 'frecuencia']);
    const terminaVal = obtenerValor(['termina', 'fechaFin', 'fechaTermino']);
    const notasVal = obtenerValor(['notas', 'observaciones', 'indicaciones']);

    const nuevoItem = {
      nombre: nombreVal,
      tipo: tipoVal,
      dosis: dosisVal,
      momento: momentoVal,
      hora: momentoVal === 'especifica' ? horaVal : null
    };

    const { data, error } = await supabaseClient
      .from('medicamentos')
      .insert([nuevoItem]);

    if (error) {
      console.error('Error al guardar en Supabase:', error);
      alert('Error al guardar: ' + error.message);
      return;
    }

    // --- CONSTRUCCIÓN DEL MENSAJE COMPLETO DE TELEGRAM ---
    const emojiTipo = tipoVal === 'skincare' ? '🧴' : '💊';
    const horarioTexto = momentoVal === 'especifica' ? `⏰ ${horaVal}` : momentoVal;

    let mensajeTelegram = `✨ *¡Nuevo Recordatorio Programado!* ✨\n\n` +
      `${emojiTipo} *Producto:* ${nombreVal || 'Sin nombre'}\n` +
      `📌 *Dosis:* ${dosisVal || 'Según indicación'}\n` +
      `⏰ *Momento:* ${horarioTexto || 'No especificado'}`;

    if (diasVal) {
      mensajeTelegram += `\n📅 *Días:* ${diasVal}`;
    }
    if (terminaVal) {
      mensajeTelegram += `\n🛑 *Termina:* ${terminaVal}`;
    }
    if (notasVal) {
      mensajeTelegram += `\n📝 *Notas:* ${notasVal}`;
    }

    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: mensajeTelegram,
          parse_mode: 'Markdown'
        })
      });
      console.log('Notificación enviada a Telegram con formato completo');
    } catch (errTelegram) {
      console.error('Error al enviar mensaje a Telegram:', errTelegram);
    }

    formulario.reset();
    if (bloqueHoraEspecifica) bloqueHoraEspecifica.style.display = 'none';
    cargarMedicamentos();
  });
}
