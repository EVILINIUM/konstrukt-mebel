async function sendToServer(name, phone) {
  try {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, phone: phone })
    });
    return await response.json();
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
}

function setupForm(formId, msgId, nameId, phoneId) {
  const form = document.getElementById(formId);
  const msg = document.getElementById(msgId);
  const nameInput = document.getElementById(nameId);
  const phoneInput = document.getElementById(phoneId);

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !phone) {
      msg.textContent = "Пожалуйста, заполните все поля.";
      msg.style.color = "#ffb4b4";
      return;
    }

    msg.textContent = "Отправка...";
    msg.style.color = "#fff";

    const result = await sendToServer(name, phone);

    if (result.ok) {
      msg.textContent = "Спасибо! Заявка сохранена.";
      msg.style.color = "#4ade80"; // Зеленый цвет
      form.reset();
    } else {
      msg.textContent = "Ошибка отправки. Попробуйте позже.";
      msg.style.color = "#ffb4b4";
    }
  });
}

setupForm('consultForm', 'consultMsg', 'cName', 'cPhone');
setupForm('quickForm', 'quickMsg', 'qName', 'qPhone');


(function initLightbox(){
  const lightbox = document.getElementById("lightbox");
  const imgEl = document.getElementById("lightboxImg");
  const btnClose = document.getElementById("lightboxClose");
  const btnPrev = document.getElementById("lightboxPrev");
  const btnNext = document.getElementById("lightboxNext");

  if (!lightbox || !imgEl) return;

  const items = Array.from(document.querySelectorAll(".gallery-card"));
  if (!items.length) return;

  let index = 0;

  function openAt(i){
    index = (i + items.length) % items.length;
    imgEl.src = items[index].getAttribute("href");
    imgEl.alt = items[index].querySelector("img")?.alt || "Фото";
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function close(){
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => imgEl.src = "", 300);
  }

  items.forEach((item, i) => {
    item.addEventListener("click", (e) => { e.preventDefault(); openAt(i); });
  });

  btnClose?.addEventListener("click", close);
  btnPrev?.addEventListener("click", () => openAt(index - 1));
  btnNext?.addEventListener("click", () => openAt(index + 1));
  
  lightbox.addEventListener("click", (e) => { if(e.target === lightbox) close(); });
  document.addEventListener("keydown", (e) => {
    if(!lightbox.classList.contains("is-open")) return;
    if(e.key === "Escape") close();
    if(e.key === "ArrowLeft") openAt(index - 1);
    if(e.key === "ArrowRight") openAt(index + 1);
  });
})();