const revealElements = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12
});

revealElements.forEach((el) => observer.observe(el));

const form = document.getElementById('leadForm');
const toast = document.getElementById('toast');

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');

  setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 3500);
}

document.querySelectorAll('.js-quiz-placeholder').forEach((button) => {
  button.addEventListener('click', () => {
    showToast('Здесь будет открываться квиз. Подключим следующим этапом.');
  });
});

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    console.log('Заявка:', data);

    showToast('Заявка пока не отправляется. Подключим Telegram позже.');
    form.reset();
  });
}


/* Phone mask +7 */
const phoneInput = document.querySelector('.phone-input');

if (phoneInput) {
  phoneInput.addEventListener('input', () => {
    let digits = phoneInput.value.replace(/\D/g, '');

    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11);

    const p1 = digits.slice(1, 4);
    const p2 = digits.slice(4, 7);
    const p3 = digits.slice(7, 9);
    const p4 = digits.slice(9, 11);

    let value = '+7';
    if (p1) value += ` (${p1}`;
    if (p1.length === 3) value += ')';
    if (p2) value += ` ${p2}`;
    if (p3) value += `-${p3}`;
    if (p4) value += `-${p4}`;

    phoneInput.value = value;
  });

  phoneInput.addEventListener('focus', () => {
    if (!phoneInput.value) phoneInput.value = '+7 ';
  });
}


/* Mobile reviews slider */
const reviewsSlider = document.getElementById('reviewsSlider');
const reviewDots = document.querySelectorAll('#reviewDots button');
const reviewPrev = document.querySelector('.review-arrow--prev');
const reviewNext = document.querySelector('.review-arrow--next');

function getReviewCards() {
  return reviewsSlider ? Array.from(reviewsSlider.querySelectorAll('.review-card')) : [];
}

function getCurrentReviewIndex() {
  const cards = getReviewCards();
  if (!reviewsSlider || !cards.length) return 0;

  const scrollLeft = reviewsSlider.scrollLeft;
  let closestIndex = 0;
  let closestDistance = Infinity;

  cards.forEach((card, index) => {
    const distance = Math.abs(card.offsetLeft - scrollLeft);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function updateReviewDots(index = getCurrentReviewIndex()) {
  reviewDots.forEach((dot, dotIndex) => {
    dot.classList.toggle('is-active', dotIndex === index);
  });
}

function scrollToReview(index) {
  const cards = getReviewCards();
  if (!reviewsSlider || !cards.length) return;

  const safeIndex = Math.max(0, Math.min(index, cards.length - 1));
  reviewsSlider.scrollTo({
    left: cards[safeIndex].offsetLeft,
    behavior: 'smooth'
  });

  updateReviewDots(safeIndex);
}

if (reviewsSlider) {
  reviewPrev?.addEventListener('click', () => {
    scrollToReview(getCurrentReviewIndex() - 1);
  });

  reviewNext?.addEventListener('click', () => {
    scrollToReview(getCurrentReviewIndex() + 1);
  });

  reviewDots.forEach((dot, index) => {
    dot.addEventListener('click', () => scrollToReview(index));
  });

  let scrollTimer;
  reviewsSlider.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => updateReviewDots(), 80);
  });
}


/* === v11: Telegram form direct integration === */
const WORKER_ENDPOINT = "https://snovaleads-form.antontatisev.workers.dev/";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatLeadMessage(data) {
  const now = new Date();
  const time = now.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return [
    "🔥 <b>Новая заявка с сайта Snova LEADS</b>",
    "",
    `<b>Имя:</b> ${escapeHtml(data.name)}`,
    `<b>Телефон:</b> ${escapeHtml(data.phone)}`,
    `<b>Ниша:</b> ${escapeHtml(data.niche || "не указана")}`,
    "",
    `<b>Мессенджер:</b> ${escapeHtml(data.messenger)}`,
    `<b>Username:</b> ${escapeHtml(data.username || "не указан")}`,
    "",
    `<b>Комментарий:</b>`,
    `${escapeHtml(data.message || "не указан")}`,
    "",
    `<b>Время:</b> ${escapeHtml(time)}`
  ].join("\n");
}

async function sendLeadToTelegram(message) {
  const response = await fetch(WORKER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Worker error: ${errorText}`);
  }

  return response.json();
}

/* Replace old form listener by cloning form */
const originalLeadForm = document.getElementById("leadForm");

if (originalLeadForm) {
  const newLeadForm = originalLeadForm.cloneNode(true);
  originalLeadForm.parentNode.replaceChild(newLeadForm, originalLeadForm);

  const newPhoneInput = newLeadForm.querySelector(".phone-input");

  if (newPhoneInput) {
    newPhoneInput.addEventListener("input", () => {
      let digits = newPhoneInput.value.replace(/\D/g, "");

      if (digits.startsWith("8")) digits = "7" + digits.slice(1);
      if (!digits.startsWith("7")) digits = "7" + digits;
      digits = digits.slice(0, 11);

      const p1 = digits.slice(1, 4);
      const p2 = digits.slice(4, 7);
      const p3 = digits.slice(7, 9);
      const p4 = digits.slice(9, 11);

      let value = "+7";
      if (p1) value += ` (${p1}`;
      if (p1.length === 3) value += ")";
      if (p2) value += ` ${p2}`;
      if (p3) value += `-${p3}`;
      if (p4) value += `-${p4}`;

      newPhoneInput.value = value;
    });

    newPhoneInput.addEventListener("focus", () => {
      if (!newPhoneInput.value) newPhoneInput.value = "+7 ";
    });
  }

  newLeadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = newLeadForm.querySelector("button[type='submit']");
    const originalButtonText = submitButton ? submitButton.innerHTML : "";

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = "Отправляю...";
      }

      const data = Object.fromEntries(new FormData(newLeadForm).entries());
      const message = formatLeadMessage(data);

      await sendLeadToTelegram(message);

      showToast("Заявка отправлена. Я скоро свяжусь с вами.");
      newLeadForm.reset();
    } catch (error) {
      console.error(error);
      showToast("Не удалось отправить заявку. Попробуйте написать в Telegram.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    }
  });
}


/* === v12: Yandex Metrika goals === */
const METRIKA_COUNTER_ID = 109541118;

function reachGoal(goalName, params = {}) {
  if (typeof ym === "function") {
    ym(METRIKA_COUNTER_ID, "reachGoal", goalName, params);
  }
}

function vkGoal(goalName) {
  if (window._tmr) {
    _tmr.push({
      id: "3770649",
      type: "reachGoal",
      goal: goalName
    });
  }
}


/* Click goals */
document.querySelectorAll(".js-consult-click, .js-quiz-placeholder").forEach((element) => {
  element.addEventListener("click", () => {
    reachGoal("consult_click");
  });
});

document.querySelectorAll(".js-tg-link").forEach((element) => {
  element.addEventListener("click", () => {
    reachGoal("tg_click");
  });
});

document.querySelectorAll(".js-max-link").forEach((element) => {
  element.addEventListener("click", () => {
    reachGoal("max_click");
  });
});

/* Patch successful Telegram send to also send lead_form goal */
const originalSendLeadToTelegram = window.sendLeadToTelegram || sendLeadToTelegram;

if (typeof sendLeadToTelegram === "function") {
  const patchedSendLeadToTelegram = async function(message) {
    const result = await originalSendLeadToTelegram(message);
    reachGoal("lead_form");
    vkGoal("lead_form");
    return result;
  };

  sendLeadToTelegram = patchedSendLeadToTelegram;
}




/* === v14: Quiz logic + Telegram + Metrika === */
const quizModal = document.getElementById("quizModal");
const quizForm = document.getElementById("quizForm");
const quizSteps = quizModal ? Array.from(quizModal.querySelectorAll(".quiz-step")) : [];
const quizProgressBar = document.getElementById("quizProgressBar");
const quizNext = document.getElementById("quizNext");
const quizBack = document.getElementById("quizBack");
const quizSubmit = document.getElementById("quizSubmit");
const quizActions = document.getElementById("quizActions");

let quizCurrentStep = 0;
let quizStarted = false;

function openQuiz() {
  if (!quizModal) return;

  quizModal.classList.add("is-open");
  quizModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("quiz-lock");

  quizCurrentStep = 0;
  updateQuiz();

  if (!quizStarted) {
    reachGoal("quiz_start");
    quizStarted = true;
  }
}

function closeQuiz() {
  if (!quizModal) return;

  quizModal.classList.remove("is-open");
  quizModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("quiz-lock");
}

function updateQuiz() {
  quizSteps.forEach((step, index) => {
    step.classList.toggle("is-active", index === quizCurrentStep);
  });

  const progressSteps = 7;
  const progress = Math.min(((quizCurrentStep + 1) / progressSteps) * 100, 100);
  if (quizProgressBar) quizProgressBar.style.width = `${progress}%`;

  if (quizBack) quizBack.style.visibility = quizCurrentStep === 0 ? "hidden" : "visible";

  if (quizNext && quizSubmit && quizActions) {
    const isContactStep = quizCurrentStep === 6;
    const isThanksStep = quizCurrentStep === 7;

    quizNext.style.display = isContactStep || isThanksStep ? "none" : "inline-flex";
    quizSubmit.style.display = isContactStep ? "inline-flex" : "none";
    quizActions.style.display = isThanksStep ? "none" : "flex";

    if (quizCurrentStep === 0) {
      quizNext.innerHTML = "Начать <span>→</span>";
    } else if (quizCurrentStep === 5) {
      quizNext.innerHTML = "Получить разбор <span>→</span>";
    } else {
      quizNext.innerHTML = "Дальше <span>→</span>";
    }
  }
}

function validateQuizStep() {
  const step = quizSteps[quizCurrentStep];
  if (!step) return true;

  const requiredRadioGroups = new Set(
    Array.from(step.querySelectorAll("input[type='radio'][required]")).map((input) => input.name)
  );

  for (const groupName of requiredRadioGroups) {
    const checked = step.querySelector(`input[name="${groupName}"]:checked`);
    if (!checked) {
      showToast("Выберите один из вариантов.");
      return false;
    }
  }

  const requiredFields = Array.from(step.querySelectorAll("input[required], select[required], textarea[required]"))
    .filter((field) => field.type !== "radio");

  for (const field of requiredFields) {
    if (!field.value.trim()) {
      field.focus();
      showToast("Заполните обязательные поля.");
      return false;
    }
  }

  return true;
}

document.querySelectorAll(".js-quiz-placeholder").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openQuiz();
  });
});

document.querySelectorAll("[data-quiz-close]").forEach((element) => {
  element.addEventListener("click", closeQuiz);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeQuiz();
});

quizNext?.addEventListener("click", () => {
  if (!validateQuizStep()) return;

  if (quizCurrentStep >= 1 && quizCurrentStep <= 4) {
    reachGoal(`quiz_step_${quizCurrentStep}`);
  }

  quizCurrentStep = Math.min(quizCurrentStep + 1, 6);
  updateQuiz();
});

quizBack?.addEventListener("click", () => {
  quizCurrentStep = Math.max(quizCurrentStep - 1, 0);
  updateQuiz();
});

function applyPhoneMask(input) {
  if (!input) return;

  input.addEventListener("input", () => {
    let digits = input.value.replace(/\D/g, "");

    if (digits.startsWith("8")) digits = "7" + digits.slice(1);
    if (!digits.startsWith("7")) digits = "7" + digits;
    digits = digits.slice(0, 11);

    const p1 = digits.slice(1, 4);
    const p2 = digits.slice(4, 7);
    const p3 = digits.slice(7, 9);
    const p4 = digits.slice(9, 11);

    let value = "+7";
    if (p1) value += ` (${p1}`;
    if (p1.length === 3) value += ")";
    if (p2) value += ` ${p2}`;
    if (p3) value += `-${p3}`;
    if (p4) value += `-${p4}`;

    input.value = value;
  });

  input.addEventListener("focus", () => {
    if (!input.value) input.value = "+7 ";
  });
}

applyPhoneMask(document.querySelector(".quiz-phone-input"));

function formatQuizMessage(data) {
  const now = new Date();
  const time = now.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return [
    "🧩 <b>Новая заявка из квиза Snova LEADS</b>",
    "",
    `<b>Ниша:</b> ${escapeHtml(data.niche)}`,
    `<b>Источник клиентов:</b> ${escapeHtml(data.traffic)}`,
    `<b>Проблема:</b> ${escapeHtml(data.problem)}`,
    `<b>Цель:</b> ${escapeHtml(data.goal)}`,
    "",
    `<b>Имя:</b> ${escapeHtml(data.name)}`,
    `<b>Телефон:</b> ${escapeHtml(data.phone)}`,
    `<b>Мессенджер:</b> ${escapeHtml(data.messenger)}`,
    `<b>Username:</b> ${escapeHtml(data.username || "не указан")}`,
    "",
    `<b>Комментарий:</b>`,
    `${escapeHtml(data.message || "не указан")}`,
    "",
    `<b>Время:</b> ${escapeHtml(time)}`
  ].join("\n");
}

quizForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateQuizStep()) return;

  const originalButtonText = quizSubmit ? quizSubmit.innerHTML : "";

  try {
    if (quizSubmit) {
      quizSubmit.disabled = true;
      quizSubmit.innerHTML = "Отправляю...";
    }

    const data = Object.fromEntries(new FormData(quizForm).entries());
    const message = formatQuizMessage(data);

    await sendLeadToTelegram(message);

    quizCurrentStep = 7;
    updateQuiz();

    reachGoal("quiz_success");
    vkGoal("quiz_success");
  } catch (error) {
    console.error(error);
    showToast("Не удалось отправить заявку. Попробуйте написать в Telegram.");
  } finally {
    if (quizSubmit) {
      quizSubmit.disabled = false;
      quizSubmit.innerHTML = originalButtonText;
    }
  }
});
