const STORAGE_KEY = "estudae_atividades_v1";

const today = new Date();
today.setHours(0, 0, 0, 0);

const initialActivities = [
  {
    id: 1,
    titulo: "Prova de Matemática",
    disciplina: "Matemática",
    tipo: "Prova",
    data: "2026-10-05",
    urgencia: "Alta",
    descricao: "Estudar semelhança de triângulos e Teorema de Pitágoras.",
    concluida: false
  },
  {
    id: 2,
    titulo: "Trabalho de História",
    disciplina: "História",
    tipo: "Trabalho",
    data: "2026-10-08",
    urgencia: "Média",
    descricao: "Finalizar a pesquisa sobre Estado Moderno e Antigo Regime.",
    concluida: false
  },
  {
    id: 3,
    titulo: "Atividade de Programação",
    disciplina: "Informática",
    tipo: "Atividade",
    data: "2026-10-03",
    urgencia: "Alta",
    descricao: "Revisar JavaScript e entregar a atividade prática.",
    concluida: false
  },
  {
    id: 4,
    titulo: "Prova de Física",
    disciplina: "Física",
    tipo: "Prova",
    data: "2026-10-14",
    urgencia: "Baixa",
    descricao: "Revisar os conteúdos indicados pelo professor.",
    concluida: false
  },
  {
    id: 5,
    titulo: "Trabalho de Português",
    disciplina: "Português",
    tipo: "Trabalho",
    data: "2026-10-20",
    urgencia: "Média",
    descricao: "Organizar a versão final e revisar o texto.",
    concluida: false
  }
];

let activities = loadActivities();
let currentFilter = "todas";
let calendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedCalendarDate = formatDate(today);

const monthNames = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

function loadActivities() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  const copy = initialActivities.map(item => ({ ...item }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
  return copy;
}

function saveActivities() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateBR(value) {
  return parseDate(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function isOverdue(activity) {
  return !activity.concluida && parseDate(activity.data) < today;
}

function daysUntil(activity) {
  return Math.round((parseDate(activity.data) - today) / 86400000);
}

function priorityRank(activity) {
  const urgency = { Alta: 0, Média: 1, Baixa: 2 };
  return (urgency[activity.urgencia] ?? 3) * 10000 + Math.max(daysUntil(activity), -999);
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active-page"));
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });

  const target = document.getElementById(pageId);
  if (target) target.classList.add("active-page");

  if (pageId === "inicio") renderDashboard();
  if (pageId === "atividades") renderActivities();
  if (pageId === "calendario") renderCalendar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    event.preventDefault();
    showPage(pageButton.dataset.page);
  }
});

function renderDashboard() {
  const pending = activities.filter(a => !a.concluida);
  const completed = activities.filter(a => a.concluida);
  const overdue = pending.filter(isOverdue);
  const urgent = pending.filter(a => a.urgencia === "Alta");

  document.getElementById("summary-grid").innerHTML = `
    <div class="summary-card">
      <span class="label">Pendentes</span>
      <span class="number">${pending.length}</span>
      <span class="mini">atividades para fazer</span>
    </div>
    <div class="summary-card">
      <span class="label">Concluídas</span>
      <span class="number">${completed.length}</span>
      <span class="mini">atividades finalizadas</span>
    </div>
    <div class="summary-card">
      <span class="label">Atrasadas</span>
      <span class="number">${overdue.length}</span>
      <span class="mini">${overdue.length ? "precisam de atenção" : "nenhuma atrasada"}</span>
    </div>
    <div class="summary-card">
      <span class="label">Urgência alta</span>
      <span class="number">${urgent.length}</span>
      <span class="mini">prioridades atuais</span>
    </div>
  `;

  const upcoming = pending
    .filter(a => !isOverdue(a))
    .sort((a, b) => parseDate(a.data) - parseDate(b.data))
    .slice(0, 5);

  const priorities = pending
    .slice()
    .sort((a, b) => priorityRank(a) - priorityRank(b))
    .slice(0, 5);

  document.getElementById("upcoming-list").innerHTML = upcoming.length
    ? upcoming.map(miniActivityHTML).join("")
    : emptyList("Nenhum próximo prazo.");

  document.getElementById("priority-list").innerHTML = priorities.length
    ? priorities.map(a => miniActivityHTML(a, true)).join("")
    : emptyList("Você não tem pendências.");
}

function emptyList(text) {
  return `<div class="empty-state" style="padding:28px 15px">${text}</div>`;
}

function miniActivityHTML(activity, priority = false) {
  const late = isOverdue(activity);
  return `
    <div class="mini-activity ${priority ? "priority-item" : ""}">
      <div>
        <div class="title">${escapeHTML(activity.titulo)}</div>
        <div class="meta">${escapeHTML(activity.disciplina)} · ${formatDateBR(activity.data)}
          ${late ? '<span class="status late"> · Atrasada</span>' : ""}
        </div>
      </div>
      <span class="badge badge-${urgencyClass(activity.urgencia)}">${escapeHTML(activity.urgencia)}</span>
    </div>
  `;
}

function urgencyClass(urgency) {
  return urgency === "Alta" ? "alta" : urgency === "Média" ? "media" : "baixa";
}

function renderActivities() {
  const container = document.getElementById("all-activities");
  let list = [...activities];

  if (currentFilter === "pendentes") list = list.filter(a => !a.concluida);
  if (currentFilter === "concluidas") list = list.filter(a => a.concluida);
  if (["Alta", "Média", "Baixa"].includes(currentFilter)) {
    list = list.filter(a => a.urgencia === currentFilter);
  }

  list.sort((a, b) => {
    if (a.concluida !== b.concluida) return a.concluida ? 1 : -1;
    return parseDate(a.data) - parseDate(b.data);
  });

  container.innerHTML = list.length
    ? list.map(activityCardHTML).join("")
    : `<div class="empty-state"><strong>Nenhuma atividade encontrada</strong><br>Cadastre uma nova atividade ou altere o filtro.</div>`;
}

function activityCardHTML(a) {
  const late = isOverdue(a);
  const urgency = a.urgencia === "Alta" ? "high" : a.urgencia === "Média" ? "medium" : "low";
  return `
    <article class="activity-card ${urgency} ${a.concluida ? "completed" : ""}">
      <div class="card-top">
        <div>
          <h3 class="card-title ${a.concluida ? "done" : ""}">${escapeHTML(a.titulo)}</h3>
          <div class="card-discipline">${escapeHTML(a.disciplina)}</div>
        </div>
        <span class="badge badge-${urgencyClass(a.urgencia)}">${escapeHTML(a.urgencia)}</span>
      </div>

      <div class="meta-row">
        <span>📚 ${escapeHTML(a.tipo)}</span>
        <span>📅 ${formatDateBR(a.data)}</span>
        <span class="${late ? "status late" : "status"}">${a.concluida ? "Concluída" : late ? "Atrasada" : "Pendente"}</span>
      </div>

      ${a.descricao ? `<div class="description">${escapeHTML(a.descricao)}</div>` : ""}

      <div class="card-actions">
        <button class="small-btn" data-detail="${a.id}">Ver detalhes</button>
        ${!a.concluida ? `<button class="small-btn complete" data-complete="${a.id}">✓ Concluir</button>` : `<span class="status">✓ Atividade concluída</span>`}
      </div>
    </article>
  `;
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    renderActivities();
  });
});

document.getElementById("all-activities").addEventListener("click", event => {
  const completeButton = event.target.closest("[data-complete]");
  const detailButton = event.target.closest("[data-detail]");

  if (completeButton) {
    const id = Number(completeButton.dataset.complete);
    const activity = activities.find(a => a.id === id);
    if (activity) {
      activity.concluida = true;
      saveActivities();
      renderActivities();
      renderDashboard();
      renderCalendar();
      showToast("Atividade marcada como concluída.");
    }
  }

  if (detailButton) {
    openDetails(Number(detailButton.dataset.detail));
  }
});

function openDetails(id) {
  const a = activities.find(item => item.id === id);
  if (!a) return;

  document.getElementById("modal-title").textContent = a.titulo;
  document.getElementById("modal-content").innerHTML = `
    <div class="detail-row"><span>Disciplina</span><strong>${escapeHTML(a.disciplina)}</strong></div>
    <div class="detail-row"><span>Tipo</span><strong>${escapeHTML(a.tipo)}</strong></div>
    <div class="detail-row"><span>Prazo</span><strong>${formatDateBR(a.data)}</strong></div>
    <div class="detail-row"><span>Urgência</span><strong>${escapeHTML(a.urgencia)}</strong></div>
    <div class="detail-row"><span>Status</span><strong>${a.concluida ? "Concluída" : isOverdue(a) ? "Atrasada" : "Pendente"}</strong></div>
    ${a.descricao ? `<div class="detail-row"><span>Descrição</span><strong>${escapeHTML(a.descricao)}</strong></div>` : ""}
  `;

  const modal = document.getElementById("details-modal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

document.querySelectorAll("[data-close-modal]").forEach(el => {
  el.addEventListener("click", closeModal);
});

function closeModal() {
  const modal = document.getElementById("details-modal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
});

document.getElementById("activity-form").addEventListener("submit", event => {
  event.preventDefault();

  const form = event.currentTarget;
  const data = new FormData(form);
  const values = {
    titulo: data.get("titulo").trim(),
    disciplina: data.get("disciplina").trim(),
    tipo: data.get("tipo"),
    data: data.get("data"),
    urgencia: data.get("urgencia"),
    descricao: data.get("descricao").trim()
  };

  const fields = ["titulo", "disciplina", "tipo", "data", "urgencia"];
  let valid = true;

  fields.forEach(field => {
    const error = document.getElementById(`error-${field}`);
    error.textContent = "";
    const value = values[field];

    if (!value) {
      error.textContent = "Preencha este campo.";
      valid = false;
    }
  });

  if (!valid) {
    showToast("Confira os campos obrigatórios.");
    return;
  }

  const newActivity = {
    id: Date.now(),
    ...values,
    concluida: false
  };

  activities.push(newActivity);
  saveActivities();
  form.reset();
  clearErrors();
  showToast("Atividade adicionada com sucesso.");
  showPage("atividades");
});

function clearErrors() {
  document.querySelectorAll(".field-error").forEach(el => el.textContent = "");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  document.getElementById("month-title").textContent = `${monthNames[month]} de ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push(calendarDayHTML(new Date(year, month - 1, prevDays - i), true));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(calendarDayHTML(new Date(year, month, day), false));
  }

  let nextDay = 1;
  while (cells.length < 42) {
    cells.push(calendarDayHTML(new Date(year, month + 1, nextDay++), true));
  }

  document.getElementById("calendar-grid").innerHTML = cells.join("");
  renderSelectedDay();
}

function calendarDayHTML(date, muted) {
  const dateString = formatDate(date);
  const tasks = activities.filter(a => a.data === dateString);
  const isToday = dateString === formatDate(today);
  const selected = dateString === selectedCalendarDate;

  return `
    <button class="calendar-day ${muted ? "muted" : ""} ${isToday ? "today" : ""} ${selected ? "selected" : ""}" data-date="${dateString}" aria-label="${date.toLocaleDateString("pt-BR")}">
      <span class="day-number">${date.getDate()}${isToday ? '<span class="day-dot"></span>' : ""}</span>
      ${tasks.length ? `<div class="day-tasks">${tasks.slice(0, 3).map(t => `<span class="day-task ${t.urgencia === "Alta" ? "high" : ""}">${escapeHTML(t.titulo)}</span>`).join("")}${tasks.length > 3 ? `<span class="status">+${tasks.length - 3} atividade(s)</span>` : ""}</div>` : ""}
    </button>
  `;
}

document.getElementById("calendar-grid").addEventListener("click", event => {
  const day = event.target.closest("[data-date]");
  if (!day) return;
  selectedCalendarDate = day.dataset.date;
  renderCalendar();
});

document.getElementById("prev-month").addEventListener("click", () => {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
  selectedCalendarDate = formatDate(calendarDate);
  renderCalendar();
});

document.getElementById("next-month").addEventListener("click", () => {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
  selectedCalendarDate = formatDate(calendarDate);
  renderCalendar();
});

function renderSelectedDay() {
  const container = document.getElementById("selected-day");
  const date = parseDate(selectedCalendarDate);
  const tasks = activities.filter(a => a.data === selectedCalendarDate);

  container.innerHTML = `
    <h3>${date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</h3>
    ${tasks.length
      ? `<div class="activity-list">${tasks.map(a => miniActivityHTML(a)).join("")}</div>`
      : `<div class="empty-state" style="padding:25px 15px">Nenhuma atividade cadastrada para este dia.</div>`
    }
  `;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.getElementById("data").min = formatDate(today);

renderDashboard();
renderActivities();
renderCalendar();