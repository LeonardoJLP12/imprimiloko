document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar los iconos de Lucide
  lucide.createIcons();

  // 2. Control de la barra inferior flotante (Sticky Bar)
  const stickyBar = document.getElementById('stickyBar');
  const closeStickyBtn = document.getElementById('closeStickyBtn');

  if (closeStickyBtn && stickyBar) {
    closeStickyBtn.addEventListener('click', () => {
      stickyBar.classList.add('hidden');
    });
  }

  // 3. Control del Modal de Compra (Abrir y Cerrar)
  const modal = document.getElementById('checkoutModal');
  const openModalBtns = document.querySelectorAll('.open-modal-btn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const checkoutForm = document.getElementById('checkoutForm');

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.add('active');
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // 4. Lógica de Pagos (S/ 24.90 para Yape y VendeMás | $7.90 USD para PayPal)
  const PEN_PRICE = 24.90;
  const USD_PRICE = 7.90;
  const WHATSAPP_NUMBER = '51989071363'; // <-- Reemplaza los 9 por tu número real con 51 adelante
  const VENDEMAS_LINK = 'https://pago-seguro.vendemas.com.pe/MmI2NjBhMmI1ODAyMS4xMDhkMzI5NDUxNzk1MjE2MDEx'; // <-- Pega aquí tu Link de Pago de VendeMás
  const PAYPAL_USER = 'OrihuelaElias'; // <-- Pon solo tu usuario de PayPal.me

  const modalTotalDisplay = document.getElementById('modalTotalDisplay');
  const priceExchangeNote = document.getElementById('priceExchangeNote');
  const paySubmitBtn = document.getElementById('paySubmitBtn');

  const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
  const paymentOptions = document.querySelectorAll('.payment-option');
  const panels = {
    yape: document.getElementById('panel-yape'),
    vendemas: document.getElementById('panel-vendemas'),
    paypal: document.getElementById('panel-paypal')
  };

  paymentRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const selected = e.target.value;

      paymentOptions.forEach(opt => opt.classList.remove('active'));
      e.target.closest('.payment-option').classList.add('active');

      Object.values(panels).forEach(panel => {
        if (panel) panel.classList.add('hidden');
      });
      if (panels[selected]) panels[selected].classList.remove('hidden');

      if (selected === 'yape' || selected === 'vendemas') {
        modalTotalDisplay.textContent = `S/ ${PEN_PRICE.toFixed(2)}`;
        priceExchangeNote.textContent = 'Pago único en soles (Perú)';
        paySubmitBtn.textContent = selected === 'yape'
          ? 'Enviar comprobante al (+51 989 071 363)'
          : `Continuar S/ ${PEN_PRICE.toFixed(2)} con Tarjeta (Niubiz)`;
      } else {
        modalTotalDisplay.textContent = `$${USD_PRICE.toFixed(2)} USD`;
        priceExchangeNote.textContent = 'Pago único internacional';
        paySubmitBtn.textContent = `Continuar con PayPal ($${USD_PRICE.toFixed(2)} USD)`;
      }
    });
  });

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('buyerName').value;
      const email = document.getElementById('buyerEmail').value;
      const method = document.querySelector('input[name="paymentMethod"]:checked').value;

      // 1. Si es Yape / Plin, abre WhatsApp directamente
      if (method === 'yape') {
        const message = `Hola, acabo de realizar el pago por Yape/Plin de S/ ${PEN_PRICE.toFixed(2)}. Aquí adjunto mi comprobante.\n\nNombre: ${name}\nCorreo para los PDF: ${email}`;
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        checkoutForm.reset();
        modal.classList.remove('active');
        return;
      }

      // 2. Para Tarjeta (VendeMás) o PayPal: guardar datos del pedido para gracias.html
      const isCard = method === 'vendemas';
      const targetUrl = isCard
        ? VENDEMAS_LINK
        : `https://www.paypal.me/${PAYPAL_USER}/${USD_PRICE.toFixed(2)}`;
      const platformName = isCard ? 'Tarjeta (Niubiz)' : 'PayPal Internacional';

      localStorage.setItem('imprimiloko_last_order', JSON.stringify({
        name: name,
        email: email,
        method: platformName,
        amount: isCard ? `S/ ${PEN_PRICE.toFixed(2)}` : `$${USD_PRICE.toFixed(2)} USD`
      }));

      // 3. Mostrar pantalla de agradecimiento con conteo regresivo automático
      const modalBox = modal.querySelector('.modal-box');
      let secondsLeft = 5;

      modalBox.innerHTML = `
        <div style="text-align:center; padding: 24px 10px;">
          <div class="badge-mint" style="margin-bottom: 12px;">¡CASI LISTO, ${name.toUpperCase()}!</div>
          <h3 style="margin-bottom: 10px;">Gracias por confiar en Imprimiloko</h3>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 16px;">
            Estamos preparando tu acceso para enviarlo a <strong>${email}</strong> una vez completado el pago.
          </p>
          <div style="background: var(--bg-card-soft); border: 1px solid var(--border-light); border-radius: 12px; padding: 14px; margin-bottom: 18px;">
            <p style="font-size: 0.85rem; color: var(--text-dark); margin: 0;">
              Redirigiendo a <strong>${platformName}</strong> en <strong id="redirectCountdown" style="color: var(--pink-primary); font-size: 1.15rem;">${secondsLeft}</strong> segundos...
            </p>
          </div>
          <a href="${targetUrl}" class="btn btn-primary btn-block">
            Ir a pagar ahora mismo
          </a>
        </div>
      `;

      const timer = setInterval(() => {
        secondsLeft -= 1;
        const countEl = document.getElementById('redirectCountdown');
        if (countEl) countEl.textContent = secondsLeft;

        if (secondsLeft <= 0) {
          clearInterval(timer);
          modal.classList.remove('active');
          window.location.href = targetUrl;
        }
      }, 1000);
    });
  }

  // 5. Contador de caracteres del textarea (0/500)
  const userNotes = document.getElementById('userNotes');
  const charCount = document.getElementById('charCount');

  if (userNotes && charCount) {
    userNotes.addEventListener('input', () => {
      charCount.textContent = userNotes.value.length;
    });
  }

  // 6. Envío del formulario principal de la sección Oferta (Pasa los datos al modal)
  const leadCaptureForm = document.getElementById('leadCaptureForm');
  if (leadCaptureForm) {
    leadCaptureForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('fullName').value;
      const email = document.getElementById('userEmail').value;

      const modalName = document.getElementById('buyerName');
      const modalEmail = document.getElementById('buyerEmail');
      if (modalName) modalName.value = name;
      if (modalEmail) modalEmail.value = email;

      leadCaptureForm.reset();
      if (charCount) charCount.textContent = '0';
      modal.classList.add('active');
    });
  }

  // 7. Acordeón de Preguntas Frecuentes (FAQ)
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', () => {
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });
      item.classList.toggle('active');
    });
  });
});