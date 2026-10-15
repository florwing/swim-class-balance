(() => {
  "use strict";

  const STORAGE_KEY = "swim-class-balance.v1";
  const LOW_BALANCE = 2;
  const weekdayLabels = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const state = {
    students: loadStudents(),
    filter: "all",
    search: "",
    messageStudentId: null,
    messageType: "lesson",
  };

  const elements = {
    heroDate: document.querySelector("#hero-date"),
    statToday: document.querySelector("#stat-today"),
    statWeek: document.querySelector("#stat-week"),
    statPayment: document.querySelector("#stat-payment"),
    statStudents: document.querySelector("#stat-students"),
    upcomingCount: document.querySelector("#upcoming-count"),
    upcomingList: document.querySelector("#upcoming-list"),
    paymentList: document.querySelector("#payment-list"),
    studentGrid: document.querySelector("#student-grid"),
    emptyState: document.querySelector("#empty-state"),
    searchInput: document.querySelector("#search-input"),
    studentDialog: document.querySelector("#student-dialog"),
    studentForm: document.querySelector("#student-form"),
    studentDialogTitle: document.querySelector("#student-dialog-title"),
    studentId: document.querySelector("#student-id"),
    studentName: document.querySelector("#student-name"),
    studentWeekday: document.querySelector("#student-weekday"),
    studentTime: document.querySelector("#student-time"),
    studentPrepaid: document.querySelector("#student-prepaid"),
    studentRemaining: document.querySelector("#student-remaining"),
    studentNextDate: document.querySelector("#student-next-date"),
    studentFormError: document.querySelector("#student-form-error"),
    rescheduleDialog: document.querySelector("#reschedule-dialog"),
    rescheduleForm: document.querySelector("#reschedule-form"),
    rescheduleId: document.querySelector("#reschedule-id"),
    rescheduleStudent: document.querySelector("#reschedule-student"),
    rescheduleDate: document.querySelector("#reschedule-date"),
    rescheduleTime: document.querySelector("#reschedule-time"),
    messageDialog: document.querySelector("#message-dialog"),
    messageTitle: document.querySelector("#message-title"),
    messageText: document.querySelector("#message-text"),
    historyDialog: document.querySelector("#history-dialog"),
    historyTitle: document.querySelector("#history-title"),
    historyList: document.querySelector("#history-list"),
    toast: document.querySelector("#toast"),
  };

  function loadStudents() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && typeof item.name === "string")
        .map((item) => ({
          id: String(item.id || makeId()),
          name: item.name.trim().slice(0, 40),
          weekday: Number.isInteger(Number(item.weekday)) && Number(item.weekday) >= 0 && Number(item.weekday) <= 6 ? Number(item.weekday) : 1,
          time: validTime(item.time) ? item.time : "18:00",
          nextTime: validTime(item.nextTime) ? item.nextTime : validTime(item.time) ? item.time : "18:00",
          prepaid: clampWhole(item.prepaid, 1, 200, 8),
          remaining: clampWhole(item.remaining, 0, 200, 0),
          nextDate: validDate(item.nextDate) ? item.nextDate : formatYmd(nextDateForWeekday(Number.isInteger(Number(item.weekday)) ? Number(item.weekday) : 1)),
          history: Array.isArray(item.history) ? item.history.slice(0, 50) : [],
          createdAt: item.createdAt || new Date().toISOString(),
        }));
    } catch {
      return [];
    }
  }

  function saveStudents() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.students));
  }

  function clampWhole(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, Math.round(number)));
  }

  function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) && !Number.isNaN(parseDate(value).getTime());
  }

  function validTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
  }

  function makeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function parseDate(dateString) {
    const [year, month, day] = String(dateString).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function formatYmd(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function nextDateForWeekday(weekday) {
    const today = startOfToday();
    const diff = (Number(weekday) - today.getDay() + 7) % 7;
    return addDays(today, diff);
  }

  function nextRecurringAfter(dateString, weekday) {
    let firstPossible = addDays(parseDate(dateString), 1);
    if (firstPossible < startOfToday()) firstPossible = startOfToday();
    const diff = (Number(weekday) - firstPossible.getDay() + 7) % 7;
    return formatYmd(addDays(firstPossible, diff));
  }

  function dateDistance(dateString) {
    return Math.round((parseDate(dateString) - startOfToday()) / 86400000);
  }

  function formatLongDate(dateString) {
    return new Intl.DateTimeFormat("zh-HK", {
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(parseDate(dateString));
  }

  function formatShortDate(dateString) {
    return new Intl.DateTimeFormat("zh-HK", {
      month: "numeric",
      day: "numeric",
    }).format(parseDate(dateString));
  }

  function formatDisplayTime(time) {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour < 12 ? "上午" : hour < 18 ? "下午" : "晚上";
    const displayHour = hour % 12 || 12;
    return `${period}${displayHour}:${String(minute).padStart(2, "0")}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function findStudent(id) {
    return state.students.find((student) => student.id === id);
  }

  function render() {
    renderDate();
    renderStats();
    renderUpcoming();
    renderPayments();
    renderStudents();
  }

  function renderDate() {
    elements.heroDate.textContent = new Intl.DateTimeFormat("zh-HK", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(new Date());
  }

  function renderStats() {
    const today = formatYmd(startOfToday());
    const week = state.students.filter((student) => {
      const distance = dateDistance(student.nextDate);
      return distance >= 0 && distance <= 6;
    });
    elements.statToday.textContent = state.students.filter((student) => student.nextDate === today).length;
    elements.statWeek.textContent = week.length;
    elements.statPayment.textContent = state.students.filter((student) => student.remaining <= LOW_BALANCE).length;
    elements.statStudents.textContent = state.students.length;
  }

  function upcomingStudents() {
    return [...state.students]
      .filter((student) => dateDistance(student.nextDate) >= 0)
      .sort((a, b) => {
        const dateCompare = a.nextDate.localeCompare(b.nextDate);
        return dateCompare || (a.nextTime || a.time).localeCompare(b.nextTime || b.time);
      })
      .slice(0, 5);
  }

  function renderUpcoming() {
    const upcoming = upcomingStudents();
    elements.upcomingCount.textContent = `${upcoming.length} 堂`;
    if (!upcoming.length) {
      elements.upcomingList.innerHTML = '<div class="empty-inline">暫時沒有即將進行的課堂。</div>';
      return;
    }

    elements.upcomingList.innerHTML = upcoming
      .map((student) => {
        const date = parseDate(student.nextDate);
        const distance = dateDistance(student.nextDate);
        const dayLabel = distance === 0 ? "今日" : distance === 1 ? "明日" : weekdayLabels[date.getDay()];
        return `
          <div class="schedule-item">
            <div class="schedule-date">
              <strong>${date.getDate()}</strong>
              <span>${escapeHtml(dayLabel)}</span>
            </div>
            <div class="schedule-details">
              <strong>${escapeHtml(student.name)}</strong>
              <span>${escapeHtml(formatDisplayTime(student.nextTime || student.time))} · 尚餘 ${student.remaining} 堂</span>
            </div>
            <button class="mini-button" type="button" data-action="message" data-id="${escapeHtml(student.id)}" data-type="lesson">提醒</button>
          </div>`;
      })
      .join("");
  }

  function renderPayments() {
    const students = [...state.students]
      .filter((student) => student.remaining <= LOW_BALANCE)
      .sort((a, b) => a.remaining - b.remaining || a.name.localeCompare(b.name, "zh-Hant"));

    if (!students.length) {
      elements.paymentList.innerHTML = '<div class="empty-inline">所有學生堂數充足，暫時毋須跟進。</div>';
      return;
    }

    elements.paymentList.innerHTML = students
      .map(
        (student) => `
          <div class="payment-item">
            <div class="balance-bubble">${student.remaining}</div>
            <div class="payment-details">
              <strong>${escapeHtml(student.name)}</strong>
              <span>${student.remaining === 0 ? "堂數已用完" : `只餘 ${student.remaining} 堂`}</span>
            </div>
            <button class="mini-button" type="button" data-action="message" data-id="${escapeHtml(student.id)}" data-type="payment">通知</button>
          </div>`,
      )
      .join("");
  }

  function renderStudents() {
    let students = [...state.students];
    const today = formatYmd(startOfToday());

    if (state.filter === "payment") students = students.filter((student) => student.remaining <= LOW_BALANCE);
    if (state.filter === "today") students = students.filter((student) => student.nextDate === today);
    if (state.search) {
      const keyword = state.search.toLocaleLowerCase("zh-Hant");
      students = students.filter((student) => student.name.toLocaleLowerCase("zh-Hant").includes(keyword));
    }

    students.sort((a, b) => a.nextDate.localeCompare(b.nextDate) || a.name.localeCompare(b.name, "zh-Hant"));
    elements.emptyState.hidden = state.students.length !== 0 || Boolean(state.search) || state.filter !== "all";

    if (!students.length) {
      elements.studentGrid.innerHTML = state.students.length
        ? '<div class="empty-inline">找不到符合條件的學生。</div>'
        : "";
      return;
    }

    elements.studentGrid.innerHTML = students.map(studentCardHtml).join("");
  }

  function studentCardHtml(student) {
    const low = student.remaining <= LOW_BALANCE;
    const percentage = Math.max(0, Math.min(100, (student.remaining / Math.max(student.prepaid, 1)) * 100));
    const initials = [...student.name.trim()].slice(0, 2).join("") || "泳";
    return `
      <article class="student-card${low ? " is-low" : ""}">
        <div class="student-top">
          <div class="student-identity">
            <div class="avatar" aria-hidden="true">${escapeHtml(initials)}</div>
            <div>
              <h3>${escapeHtml(student.name)}</h3>
              <p>${escapeHtml(weekdayLabels[student.weekday])} · ${escapeHtml(formatDisplayTime(student.time))}</p>
            </div>
          </div>
          <button class="menu-button" type="button" data-action="edit" data-id="${escapeHtml(student.id)}" aria-label="編輯 ${escapeHtml(student.name)}" title="編輯學生">···</button>
        </div>
        <div class="student-meta">
          <div class="meta-box">
            <span>下一堂</span>
            <strong>${escapeHtml(formatShortDate(student.nextDate))} ${escapeHtml(formatDisplayTime(student.nextTime || student.time))}</strong>
          </div>
          <div class="meta-box">
            <span>預繳堂數</span>
            <strong>${student.prepaid} 堂</strong>
          </div>
        </div>
        <div class="balance-row">
          <span>${low ? "需要跟進續費" : "剩餘堂數"}</span>
          <strong>${student.remaining} 堂</strong>
        </div>
        <div class="progress" aria-label="尚餘 ${student.remaining} 堂，共預繳 ${student.prepaid} 堂">
          <span style="width:${percentage}%"></span>
        </div>
        <div class="student-actions">
          <button class="action-complete" type="button" data-action="complete" data-id="${escapeHtml(student.id)}">完成一堂</button>
          <button class="action-secondary" type="button" data-action="message" data-id="${escapeHtml(student.id)}" data-type="${low ? "payment" : "lesson"}">準備提醒</button>
          <button class="action-secondary" type="button" data-action="reschedule" data-id="${escapeHtml(student.id)}">更改下一堂</button>
          <button class="action-secondary" type="button" data-action="cancel" data-id="${escapeHtml(student.id)}">取消本堂</button>
        </div>
        <div class="card-footer-actions">
          <button class="text-action" type="button" data-action="history" data-id="${escapeHtml(student.id)}">課堂紀錄</button>
          <button class="text-action" type="button" data-action="edit" data-id="${escapeHtml(student.id)}">編輯</button>
          <button class="text-action danger" type="button" data-action="delete" data-id="${escapeHtml(student.id)}">刪除</button>
        </div>
      </article>`;
  }

  function openStudentDialog(student = null) {
    elements.studentForm.reset();
    elements.studentFormError.textContent = "";
    elements.studentId.value = student?.id || "";
    elements.studentDialogTitle.textContent = student ? "編輯學生" : "新增學生";
    elements.studentName.value = student?.name || "";
    elements.studentWeekday.value = String(student?.weekday ?? 1);
    elements.studentTime.value = student?.time || "18:00";
    elements.studentPrepaid.value = String(student?.prepaid ?? 8);
    elements.studentRemaining.value = String(student?.remaining ?? 8);
    elements.studentNextDate.value = student?.nextDate || formatYmd(nextDateForWeekday(1));
    elements.studentDialog.showModal();
    requestAnimationFrame(() => elements.studentName.focus());
  }

  function saveStudentFromForm(event) {
    event.preventDefault();
    if (!elements.studentForm.reportValidity()) return;

    const name = elements.studentName.value.trim();
    const prepaid = Number(elements.studentPrepaid.value);
    const remaining = Number(elements.studentRemaining.value);
    if (!name) {
      elements.studentFormError.textContent = "請輸入學生姓名。";
      return;
    }
    if (!Number.isInteger(prepaid) || !Number.isInteger(remaining)) {
      elements.studentFormError.textContent = "堂數必須是整數。";
      return;
    }

    const id = elements.studentId.value;
    const existing = id ? findStudent(id) : null;
    const time = elements.studentTime.value;
    const data = {
      id: existing?.id || makeId(),
      name,
      weekday: Number(elements.studentWeekday.value),
      time,
      nextTime: existing && existing.time === time ? existing.nextTime : time,
      prepaid,
      remaining,
      nextDate: elements.studentNextDate.value,
      history: existing?.history || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    if (existing) {
      Object.assign(existing, data);
      showToast("學生資料已更新");
    } else {
      state.students.push(data);
      showToast("學生已新增");
    }
    saveStudents();
    elements.studentDialog.close();
    render();
  }

  function markComplete(student) {
    if (student.remaining <= 0) {
      showToast("堂數已用完，請先安排續費");
      openMessageDialog(student, "payment");
      return;
    }
    const label = `${formatLongDate(student.nextDate)} ${formatDisplayTime(student.nextTime || student.time)}`;
    if (!window.confirm(`確認 ${student.name} 已完成 ${label} 的課堂，並扣減一堂？`)) return;
    student.remaining -= 1;
    student.history.unshift({
      id: makeId(),
      type: "completed",
      lessonDate: student.nextDate,
      lessonTime: student.nextTime || student.time,
      createdAt: new Date().toISOString(),
    });
    student.nextDate = nextRecurringAfter(student.nextDate, student.weekday);
    student.nextTime = student.time;
    trimHistory(student);
    commit("課堂已完成，堂數已扣減");
  }

  function cancelLesson(student) {
    const label = `${formatLongDate(student.nextDate)} ${formatDisplayTime(student.nextTime || student.time)}`;
    if (!window.confirm(`確認取消 ${student.name} 在 ${label} 的課堂？本次不會扣堂。`)) return;
    student.history.unshift({
      id: makeId(),
      type: "cancelled",
      lessonDate: student.nextDate,
      lessonTime: student.nextTime || student.time,
      createdAt: new Date().toISOString(),
    });
    student.nextDate = nextRecurringAfter(student.nextDate, student.weekday);
    student.nextTime = student.time;
    trimHistory(student);
    commit("課堂已取消，沒有扣減堂數");
  }

  function openRescheduleDialog(student) {
    elements.rescheduleId.value = student.id;
    elements.rescheduleStudent.textContent = `${student.name}｜原定 ${formatLongDate(student.nextDate)} ${formatDisplayTime(student.nextTime || student.time)}`;
    elements.rescheduleDate.value = student.nextDate;
    elements.rescheduleTime.value = student.nextTime || student.time;
    elements.rescheduleDialog.showModal();
  }

  function rescheduleLesson(event) {
    event.preventDefault();
    if (!elements.rescheduleForm.reportValidity()) return;
    const student = findStudent(elements.rescheduleId.value);
    if (!student) return;
    const oldDate = student.nextDate;
    const oldTime = student.nextTime || student.time;
    const newDate = elements.rescheduleDate.value;
    const newTime = elements.rescheduleTime.value;
    student.history.unshift({
      id: makeId(),
      type: "rescheduled",
      lessonDate: oldDate,
      lessonTime: oldTime,
      newDate,
      newTime,
      createdAt: new Date().toISOString(),
    });
    student.nextDate = newDate;
    student.nextTime = newTime;
    trimHistory(student);
    elements.rescheduleDialog.close();
    commit("下一堂時間已更改");
  }

  function trimHistory(student) {
    student.history = student.history.slice(0, 50);
  }

  function deleteStudent(student) {
    if (!window.confirm(`確定刪除 ${student.name}？此學生的本機課堂紀錄亦會一併刪除。`)) return;
    state.students = state.students.filter((item) => item.id !== student.id);
    commit("學生資料已刪除");
  }

  function openMessageDialog(student, type = "lesson") {
    state.messageStudentId = student.id;
    state.messageType = type;
    elements.messageTitle.textContent = `${student.name}｜提醒訊息`;
    document.querySelectorAll("[data-message-type]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.messageType === type);
    });
    updateMessageText();
    elements.messageDialog.showModal();
  }

  function updateMessageText() {
    const student = findStudent(state.messageStudentId);
    if (!student) return;
    if (state.messageType === "payment") {
      const balanceText = student.remaining === 0 ? "現有預繳課堂已經完成" : `目前尚餘 ${student.remaining} 堂預繳課堂`;
      elements.messageText.value = `你好，提提你：${student.name}${balanceText}。請安排續繳，以便保留之後的上課時段，謝謝！`;
    } else {
      elements.messageText.value = `你好，提提你：${student.name} 下一堂游泳課是 ${formatLongDate(student.nextDate)} ${formatDisplayTime(student.nextTime || student.time)}。如需改期，請提早通知，謝謝！`;
    }
  }

  async function copyMessage() {
    const text = elements.messageText.value;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      elements.messageText.select();
      document.execCommand("copy");
    }
    showToast("訊息已複製，請檢查後再發送");
  }

  function openHistory(student) {
    elements.historyTitle.textContent = `${student.name}｜課堂紀錄`;
    if (!student.history.length) {
      elements.historyList.innerHTML = '<div class="empty-inline">暫時未有完成、取消或改期紀錄。</div>';
    } else {
      elements.historyList.innerHTML = student.history
        .map((entry) => {
          const typeLabel = entry.type === "completed" ? "已完成一堂" : entry.type === "cancelled" ? "已取消課堂" : "已更改課堂";
          const detail = entry.type === "rescheduled"
            ? `${formatShortDate(entry.lessonDate)} ${formatDisplayTime(entry.lessonTime)} → ${formatShortDate(entry.newDate)} ${formatDisplayTime(entry.newTime)}`
            : `${formatLongDate(entry.lessonDate)} ${formatDisplayTime(entry.lessonTime)}${entry.type === "completed" ? " · 已扣一堂" : " · 沒有扣堂"}`;
          return `
            <div class="history-item is-${escapeHtml(entry.type)}">
              <span class="history-dot" aria-hidden="true"></span>
              <div>
                <strong>${escapeHtml(typeLabel)}</strong>
                <span>${escapeHtml(detail)}</span>
              </div>
            </div>`;
        })
        .join("");
    }
    elements.historyDialog.showModal();
  }

  function commit(message) {
    saveStudents();
    render();
    showToast(message);
  }

  let toastTimer;
  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
  }

  function loadDemoData() {
    if (state.students.length && !window.confirm("載入示範資料會加入三位虛構學生。是否繼續？")) return;
    const today = startOfToday();
    const demo = [
      { name: "陳同學（示範）", offset: 0, time: "18:00", prepaid: 8, remaining: 2 },
      { name: "李同學（示範）", offset: 1, time: "16:30", prepaid: 10, remaining: 6 },
      { name: "黃同學（示範）", offset: 3, time: "19:15", prepaid: 8, remaining: 0 },
    ].map((item) => {
      const nextDate = addDays(today, item.offset);
      return {
        id: makeId(),
        name: item.name,
        weekday: nextDate.getDay(),
        time: item.time,
        nextTime: item.time,
        prepaid: item.prepaid,
        remaining: item.remaining,
        nextDate: formatYmd(nextDate),
        history: [],
        createdAt: new Date().toISOString(),
      };
    });
    state.students.push(...demo);
    commit("已載入三位虛構學生作示範");
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.close) {
      document.querySelector(`#${button.dataset.close}`)?.close();
      return;
    }

    if (button.dataset.messageType) {
      state.messageType = button.dataset.messageType;
      document.querySelectorAll("[data-message-type]").forEach((tab) => tab.classList.toggle("is-active", tab === button));
      updateMessageText();
      return;
    }

    const action = button.dataset.action;
    if (action === "open-add") {
      openStudentDialog();
      return;
    }

    const student = button.dataset.id ? findStudent(button.dataset.id) : null;
    if (!student) return;
    if (action === "edit") openStudentDialog(student);
    if (action === "complete") markComplete(student);
    if (action === "cancel") cancelLesson(student);
    if (action === "reschedule") openRescheduleDialog(student);
    if (action === "message") openMessageDialog(student, button.dataset.type || "lesson");
    if (action === "history") openHistory(student);
    if (action === "delete") deleteStudent(student);
  });

  document.querySelectorAll(".modal").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderStudents();
    });
  });

  elements.searchInput.addEventListener("input", () => {
    state.search = elements.searchInput.value.trim();
    renderStudents();
  });

  elements.studentWeekday.addEventListener("change", () => {
    if (!elements.studentId.value) elements.studentNextDate.value = formatYmd(nextDateForWeekday(Number(elements.studentWeekday.value)));
  });

  elements.studentPrepaid.addEventListener("input", () => {
    if (!elements.studentId.value) elements.studentRemaining.value = elements.studentPrepaid.value;
  });

  elements.studentForm.addEventListener("submit", saveStudentFromForm);
  elements.rescheduleForm.addEventListener("submit", rescheduleLesson);
  document.querySelector("#copy-message").addEventListener("click", copyMessage);
  document.querySelector("#load-demo").addEventListener("click", loadDemoData);

  render();
})();

