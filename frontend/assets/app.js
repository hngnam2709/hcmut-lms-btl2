(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const ROLE_LABELS = { STUDENT: "Sinh viên", STAFF: "Cán bộ", ADMIN: "Quản trị viên" };

  const state = {
    user: null,
    role: null,
    selectedRole: null,
    courses: null,
    profile: null,
    grades: null,
    viewMode: "list",
    search: "",
    courseFilter: "all",
    courseSort: "name",
    courseTab: "overview",
    adminTab: "users",
    adminCache: {},
  };

  /* ------------------------------------------------------------------ */
  /* Icons                                                               */
  /* ------------------------------------------------------------------ */
  const ICONS = {
    graduation: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><path d="M22 10v6"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    more: '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
    megaphone: '<path d="m3 11 18-5v12L3 13v-2Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="m8.2 13.2-1.7 8 5.5-3 5.5 3-1.7-8"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
  };

  function hydrateIcons(root = document) {
    $$("[data-icon]", root).forEach((node) => {
      const name = node.getAttribute("data-icon");
      const path = ICONS[name];
      if (!path) return;
      node.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
    });
  }

  function icon(name, width = 18) {
    const path = ICONS[name] || "";
    return `<svg viewBox="0 0 24 24" width="${width}" height="${width}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString("vi-VN", { maximumFractionDigits: 2 }) : "—";
  }

  function formatPercent(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return `${number.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
  }

  function formatDate(value) {
    if (!value) return "—";
    const text = String(value).replace("T", " ");
    const [datePart, timePart] = text.split(" ");
    const pieces = datePart.split("-");
    if (pieces.length !== 3) return text;
    const date = `${pieces[2]}/${pieces[1]}/${pieces[0]}`;
    return timePart ? `${date} ${timePart.slice(0, 5)}` : date;
  }

  function formatTime(value) {
    if (!value) return "—";
    return String(value).slice(0, 5);
  }

  function dayName(dayOfWeek) {
    const names = ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
    return names[Number(dayOfWeek)] || `Ngày ${dayOfWeek}`;
  }

  function semesterLabel(row) {
    return `${row.AcademicYear || "—"} · HK${row.TermNo ?? "—"}`;
  }

  function statusBadge(status) {
    const value = String(status || "").toUpperCase();
    const known = ["ACTIVE", "DROPPED", "COMPLETED", "OPEN", "CLOSED", "CANCELLED", "LOCKED", "INACTIVE"];
    const css = known.includes(value) ? value.toLowerCase() : "neutral";
    return `<span class="badge-soft ${css}">${escapeHtml(value || "—")}</span>`;
  }

  function thumbVariant(id) {
    return `v${(Math.abs(Number(id) || 1) % 6) + 1}`;
  }

  function toMysqlDateTime(value) {
    if (!value) return "";
    return String(value).replace("T", " ") + (String(value).length === 16 ? ":00" : "");
  }

  function notify(message, type = "success") {
    const container = $("#toastContainer");
    if (!container) return;
    const tone = ["success", "danger", "warning", "info"].includes(type) ? type : "info";
    const wrapper = document.createElement("div");
    wrapper.className = `toast align-items-center text-bg-${tone} border-0`;
    wrapper.setAttribute("role", "status");
    wrapper.setAttribute("aria-live", "polite");
    wrapper.setAttribute("aria-atomic", "true");
    wrapper.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Đóng"></button>
      </div>`;
    container.appendChild(wrapper);
    const toast = new bootstrap.Toast(wrapper, { delay: 4200 });
    wrapper.addEventListener("hidden.bs.toast", () => wrapper.remove());
    toast.show();
  }

  class ApiError extends Error {
    constructor(message, status, body) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.body = body;
    }
  }

  async function api(path, options = {}) {
    const { method = "GET", body } = options;
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    let response;
    try {
      response = await fetch(path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      throw new ApiError("Không kết nối được Flask API. Kiểm tra server.", 0, null);
    }
    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }
    if (!response.ok) {
      const message = payload?.error?.message || `Yêu cầu thất bại (HTTP ${response.status}).`;
      throw new ApiError(message, response.status, payload);
    }
    return payload;
  }

  function setBusy(button, text) {
    if (!button) return () => {};
    const original = button.innerHTML;
    button.disabled = true;
    button.textContent = text;
    return () => {
      button.disabled = false;
      button.innerHTML = original;
      hydrateIcons(button);
    };
  }

  /* ------------------------------------------------------------------ */
  /* Modal helpers                                                       */
  /* ------------------------------------------------------------------ */
  function openModal({ title, body, footer = "", size = "" }) {
    $("#appModalTitle").textContent = title;
    $("#appModalBody").innerHTML = body;
    $("#appModalFooter").innerHTML = footer;
    $("#appModalDialog").className =
      "modal-dialog modal-dialog-centered modal-dialog-scrollable" + (size ? ` modal-${size}` : "");
    hydrateIcons($("#appModal"));
    bootstrap.Modal.getOrCreateInstance($("#appModal")).show();
    return $("#appModalBody");
  }

  function closeModal() {
    bootstrap.Modal.getOrCreateInstance($("#appModal")).hide();
  }

  function confirmAction(message, onConfirm, { title = "Xác nhận", danger = true, label = "Xác nhận" } = {}) {
    $("#confirmTitle").textContent = title;
    $("#confirmBody").innerHTML = message;
    const yes = $("#confirmYes");
    yes.className = `btn ${danger ? "btn-danger" : "btn-pink"}`;
    yes.textContent = label;
    yes.onclick = async () => {
      bootstrap.Modal.getOrCreateInstance($("#confirmModal")).hide();
      await onConfirm();
    };
    bootstrap.Modal.getOrCreateInstance($("#confirmModal")).show();
  }

  function emptyState(title, note = "", glyph = "∅") {
    return `<div class="empty-state"><div class="empty-glyph" aria-hidden="true">${glyph}</div><strong>${escapeHtml(title)}</strong>${note ? `<span>${escapeHtml(note)}</span>` : ""}</div>`;
  }

  function errorState(message) {
    return `<div class="empty-state"><div class="empty-glyph" aria-hidden="true">!</div><strong>Không tải được dữ liệu</strong><span>${escapeHtml(message)}</span></div>`;
  }

  function loadingState(text = "Đang tải…") {
    return `<div class="panel"><div class="panel-body text-center cell-muted">${escapeHtml(text)}</div></div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Auth                                                                */
  /* ------------------------------------------------------------------ */
  async function checkAuth() {
    try {
      const payload = await api("/api/auth/me");
      state.user = payload.data?.user || null;
      state.role = payload.data?.role || null;
    } catch (error) {
      state.user = null;
      state.role = null;
    }
    const loginScreen = $("#loginScreen");
    const appShell = $("#appShell");
    if (state.role) {
      loginScreen.hidden = true;
      appShell.hidden = false;
      applyUserChrome();
      renderNav();
      return true;
    }
    loginScreen.hidden = false;
    appShell.hidden = true;
    return false;
  }

  function applyUserChrome() {
    const name = state.user?.FullName || "—";
    $("#userName").textContent = name;
    $("#userNameLg").textContent = name;
    $("#userEmailLg").textContent = state.user?.Email || "";
    $("#userRoleBadge").textContent = ROLE_LABELS[state.role] || state.role || "";
    $("#userAvatar").textContent = initials(name);
    $("#userAvatarLg").textContent = initials(name);
  }

  function bindLogin() {
    $$("#loginRoleGrid .role-tile").forEach((tile) => {
      tile.addEventListener("click", () => selectLoginRole(tile.dataset.role));
    });
    $("#loginSubmitBtn").addEventListener("click", submitLogin);
  }

  async function selectLoginRole(role) {
    state.selectedRole = role;
    $$("#loginRoleGrid .role-tile").forEach((tile) => {
      const active = tile.dataset.role === role;
      tile.classList.toggle("selected", active);
      tile.setAttribute("aria-checked", String(active));
    });
    const select = $("#loginAccountSelect");
    const empty = $("#loginAccountEmpty");
    const submit = $("#loginSubmitBtn");
    select.innerHTML = "";
    select.classList.add("d-none");
    select.disabled = true;
    submit.disabled = true;
    empty.classList.remove("d-none");
    empty.textContent = "Đang tải tài khoản…";
    try {
      const payload = await api(`/api/auth/accounts?role=${encodeURIComponent(role)}`);
      const accounts = payload.data || [];
      if (!accounts.length) {
        empty.textContent = "Không có tài khoản cho vai trò này.";
        return;
      }
      const options = ['<option value="">Chọn tài khoản…</option>'];
      for (const account of accounts) {
        const inactive = account.AccountStatus !== "ACTIVE";
        const suffix = inactive ? ` (${account.AccountStatus})` : "";
        const detail = account.StudentCode || (role === "STAFF" ? "Cán bộ" : role === "ADMIN" ? "Quản trị" : "");
        options.push(
          `<option value="${escapeHtml(account.UserID)}" ${inactive ? "disabled" : ""}>${escapeHtml(account.FullName)}${detail ? ` — ${escapeHtml(detail)}` : ""}${escapeHtml(suffix)}</option>`,
        );
      }
      select.innerHTML = options.join("");
      select.classList.remove("d-none");
      select.disabled = false;
      empty.classList.add("d-none");
      select.onchange = () => {
        submit.disabled = !select.value;
      };
    } catch (error) {
      empty.textContent = error.message || "Không tải được tài khoản.";
    }
  }

  async function submitLogin() {
    const role = state.selectedRole;
    const userId = Number($("#loginAccountSelect").value);
    if (!role || !userId) return;
    const restore = setBusy($("#loginSubmitBtn"), "Đang đăng nhập…");
    try {
      await api("/api/auth/login", { method: "POST", body: { role, user_id: userId } });
      const ok = await checkAuth();
      if (ok) {
        state.courses = null;
        state.profile = null;
        state.grades = null;
        state.adminCache = {};
        location.hash = "#/dashboard";
        await render();
      }
    } catch (error) {
      notify(error.message, "danger");
    } finally {
      restore();
    }
  }

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch (error) {
      // ignore
    }
    state.user = null;
    state.role = null;
    state.courses = null;
    state.profile = null;
    state.grades = null;
    state.adminCache = {};
    location.hash = "";
    location.reload();
  }

  function bindAccountMenu() {
    const button = $("#accountBtn");
    const dropdown = $("#accountDropdown");
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = dropdown.hidden;
      dropdown.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (event) => {
      if (!dropdown.hidden && !dropdown.contains(event.target) && event.target !== button) {
        dropdown.hidden = true;
        button.setAttribute("aria-expanded", "false");
      }
    });
    $("#logoutBtn").addEventListener("click", logout);
    $("#profileBtn").addEventListener("click", () => {
      dropdown.hidden = true;
      location.hash = "#/profile";
    });
  }

  /* ------------------------------------------------------------------ */
  /* Navigation / router                                                 */
  /* ------------------------------------------------------------------ */
  const NAV = {
    STUDENT: [
      { key: "dashboard", label: "Bảng điều khiển", href: "#/dashboard" },
      { key: "courses", label: "Các khoá học của tôi", href: "#/courses" },
      { key: "grades", label: "Điểm của tôi", href: "#/grades" },
    ],
    STAFF: [
      { key: "dashboard", label: "Bảng điều khiển", href: "#/dashboard" },
      { key: "courses", label: "Lớp tôi dạy", href: "#/courses" },
    ],
    ADMIN: [
      { key: "dashboard", label: "Bảng điều khiển", href: "#/dashboard" },
      { key: "admin", label: "Quản trị", href: "#/admin" },
      { key: "data", label: "Dữ liệu", href: "#/admin?tab=data" },
    ],
  };

  function parseRoute() {
    const raw = location.hash.replace(/^#\/?/, "") || "dashboard";
    const [pathPart, queryPart] = raw.split("?");
    return {
      parts: pathPart.split("/").filter(Boolean),
      query: new URLSearchParams(queryPart || ""),
    };
  }

  function renderNav() {
    const items = NAV[state.role] || [];
    const { parts, query } = parseRoute();
    const current = parts[0] || "dashboard";
    const currentTab = query.get("tab") || "users";
    $("#navLinks").innerHTML = items
      .map((item) => {
        let active = false;
        if (item.key === "data") active = current === "admin" && currentTab === "data";
        else if (item.key === "admin") active = current === "admin" && currentTab !== "data";
        else active = current === item.key;
        return `<a href="${item.href}" class="${active ? "active" : ""}">${escapeHtml(item.label)}</a>`;
      })
      .join("");
  }

  async function render() {
    if (!state.role) return;
    const { parts, query } = parseRoute();
    renderNav();
    const view = $("#view");
    view.innerHTML = loadingState();
    try {
      if (parts[0] === "course") await renderCourse(Number(parts[1]));
      else if (parts[0] === "courses") await renderCourses();
      else if (parts[0] === "grades") await renderGrades();
      else if (parts[0] === "profile") await renderProfile();
      else if (parts[0] === "admin") await renderAdmin(query.get("tab") || "users");
      else await renderDashboard();
    } catch (error) {
      view.innerHTML = errorState(error.message || "Lỗi không xác định.");
    }
    hydrateIcons(view);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  /* ------------------------------------------------------------------ */
  /* Shared data loaders                                                 */
  /* ------------------------------------------------------------------ */
  async function loadCourses(force = false) {
    if (state.courses && !force) return state.courses;
    const path = state.role === "STAFF" ? "/api/staff/sections" : "/api/student/sections";
    const payload = await api(path);
    state.courses = payload.data || [];
    return state.courses;
  }

  async function loadProfile(force = false) {
    if (state.profile && !force) return state.profile;
    if (state.role !== "STUDENT") return null;
    const payload = await api("/api/student/profile");
    state.profile = payload.data || null;
    return state.profile;
  }

  async function loadGrades(force = false) {
    if (state.grades && !force) return state.grades;
    if (state.role !== "STUDENT") return [];
    const payload = await api("/api/student/grades");
    state.grades = payload.data || [];
    return state.grades;
  }

  /* ------------------------------------------------------------------ */
  /* Dashboard                                                           */
  /* ------------------------------------------------------------------ */
  async function renderDashboard() {
    if (state.role === "STUDENT") return renderStudentDashboard();
    if (state.role === "STAFF") return renderStaffDashboard();
    return renderAdminDashboard();
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 11) return "Chào buổi sáng";
    if (hour < 14) return "Chào buổi trưa";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }

  function pageHead(title, subtitle, crumbs) {
    return `<div class="page-head">
      <div class="breadcrumb-bar">${crumbs || '<a href="#/dashboard">Trang chủ</a>'}</div>
      <h1 class="page-title">${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="page-subtitle">${escapeHtml(subtitle)}</p>` : ""}
    </div>`;
  }

  async function renderStudentDashboard() {
    const [profileResult, coursesResult, gradesResult] = await Promise.allSettled([
      loadProfile(true),
      loadCourses(true),
      loadGrades(true),
    ]);
    const profile = profileResult.status === "fulfilled" ? profileResult.value || {} : {};
    const courses = coursesResult.status === "fulfilled" ? coursesResult.value : [];
    const grades = gradesResult.status === "fulfilled" ? gradesResult.value : [];
    const active = courses.filter((row) => row.EnrollmentStatus === "ACTIVE");
    const published = grades.filter((g) => g.IsPublished);
    const average = published.length
      ? published.reduce((sum, g) => sum + (Number(g.ScorePercent) || 0), 0) / published.length
      : null;
    const upcoming = await loadUpcoming(courses);

    $("#view").innerHTML = `
      ${pageHead("Bảng điều khiển", `${greeting()}, ${profile.FullName || state.user?.FullName || "bạn"}. Đây là tổng quan học tập của bạn.`)}
      <div class="panel mb-3">
        <div class="panel-body d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div class="d-flex align-items-center gap-3">
            <span class="avatar" style="width:56px;height:56px;font-size:1.05rem">${escapeHtml(initials(profile.FullName || state.user?.FullName))}</span>
            <div>
              <div class="cell-primary" style="font-size:1.05rem">${escapeHtml(profile.FullName || "—")}</div>
              <div class="cell-muted">${escapeHtml(profile.StudentCode || "")} · ${escapeHtml(profile.FacultyName || "—")}</div>
              <div class="cell-muted">${escapeHtml(profile.Email || "")}</div>
            </div>
          </div>
          <div class="d-flex gap-2">
            <a class="btn btn-soft btn-sm" href="#/courses">Xem khoá học</a>
            <a class="btn btn-pink btn-sm" href="#/grades">Xem điểm</a>
          </div>
        </div>
      </div>
      <div class="stat-grid mb-2">
        <article class="stat-card" style="--accent:var(--pink-500)">
          <div class="stat-label">Khoá học</div>
          <div class="stat-value">${formatNumber(courses.length)}</div>
          <div class="stat-hint">${formatNumber(active.length)} đang học</div>
        </article>
        <article class="stat-card" style="--accent:#c11c84">
          <div class="stat-label">Bài đã chấm</div>
          <div class="stat-value">${formatNumber(published.length)}</div>
          <div class="stat-hint">Điểm đã công bố</div>
        </article>
        <article class="stat-card" style="--accent:#a63d7f">
          <div class="stat-label">Điểm trung bình</div>
          <div class="stat-value">${average === null ? "—" : formatPercent(average)}</div>
          <div class="stat-hint">Theo các đầu điểm đã công bố</div>
        </article>
        <article class="stat-card" style="--accent:#d76b8f">
          <div class="stat-label">Quá hạn</div>
          <div class="stat-value">${formatNumber(upcoming.filter((item) => item.overdue).length)}</div>
          <div class="stat-hint">Bài tập và quiz cần xử lý</div>
        </article>
      </div>
      <div class="row g-3 mt-1">
        <div class="col-lg-7">
          <div class="panel h-100">
            <div class="panel-head">
              <div><h3>Hạn nộp</h3><p>Bài tập và quiz gần nhất</p></div>
              <a class="btn btn-light btn-sm" href="#/courses">Tất cả khoá học</a>
            </div>
            <div class="panel-body">
              ${upcoming.length ? `<div class="stack">${upcoming.slice(0, 6).map(upcomingRow).join("")}</div>` : emptyState("Không có hoạt động sắp tới", "Bạn đã hoàn thành các hoạt động hiện có.")}
            </div>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="panel h-100">
            <div class="panel-head"><div><h3>Khoá học gần đây</h3><p>Các lớp bạn đang theo học</p></div></div>
            <div class="panel-body">
              ${active.length ? `<div class="stack">${active.slice(0, 4).map((row) => `
                <a class="list-row text-decoration-none" href="#/course/${escapeHtml(row.SectionID)}">
                  <div class="list-row-flex">
                    <span class="row-icon">${icon("book")}</span>
                    <div class="list-row-main">
                      <div class="list-row-title">${escapeHtml(row.CourseName)}</div>
                      <div class="list-row-meta">${escapeHtml(row.SectionCode)} · ${escapeHtml(row.InstructorName || "Chưa có giảng viên")}</div>
                    </div>
                  </div>
                  <span class="list-row-side cell-muted">${escapeHtml(semesterLabel(row))}</span>
                </a>`).join("")}</div>` : emptyState("Chưa có khoá học", "Hãy đăng ký môn học để bắt đầu.")}
            </div>
          </div>
        </div>
      </div>`;
  }

  function upcomingRow(item) {
    return `<div class="list-row">
      <div class="list-row-flex">
        <span class="row-icon">${icon(item.type === "QUIZ" ? "clock" : "file")}</span>
        <div class="list-row-main">
          <div class="list-row-title">${escapeHtml(item.Title)}</div>
          <div class="list-row-meta">${escapeHtml(item.CourseName)} · ${escapeHtml(item.SectionCode)} · ${item.type === "QUIZ" ? "Quiz" : "Bài tập"}</div>
        </div>
      </div>
      <span class="list-row-side">
        <span class="badge-soft ${item.overdue ? "dropped" : "active"}">${item.overdue ? "Quá hạn" : "Sắp tới"}</span>
        <span class="cell-muted">${escapeHtml(formatDate(item.due))}</span>
      </span>
    </div>`;
  }

  async function loadUpcoming(courses) {
    if (!courses.length) return [];
    const results = await Promise.allSettled(
      courses.map((row) => api(`/api/student/sections/${row.SectionID}/assessments`)),
    );
    const items = [];
    results.forEach((result, index) => {
      if (result.status !== "fulfilled") return;
      const course = courses[index];
      for (const assessment of result.value.data || []) {
        const due = assessment.DueDate || assessment.CloseTime || assessment.OpenDate || assessment.OpenTime;
        if (!due) continue;
        items.push({
          ...assessment,
          CourseName: course.CourseName,
          SectionCode: course.SectionCode,
          due,
          overdue: new Date(String(due).replace(" ", "T")) < new Date(),
          type: assessment.AssessmentType,
        });
      }
    });
    items.sort((a, b) => new Date(String(a.due).replace(" ", "T")) - new Date(String(b.due).replace(" ", "T")));
    return items;
  }

  async function renderStaffDashboard() {
    const courses = await loadCourses(true);
    const details = await Promise.allSettled(
      courses.map((row) => api(`/api/staff/sections/${row.SectionID}/submissions`)),
    );
    let totalStudents = 0;
    const studentResults = await Promise.allSettled(
      courses.map((row) => api(`/api/staff/sections/${row.SectionID}/students`)),
    );
    studentResults.forEach((result) => {
      if (result.status === "fulfilled") totalStudents += (result.value.data || []).length;
    });
    const submissions = [];
    details.forEach((result) => {
      if (result.status === "fulfilled") submissions.push(...(result.value.data || []));
    });
    const ungraded = submissions.filter((row) => row.Score == null).length;

    $("#view").innerHTML = `
      ${pageHead("Bảng điều khiển", `${greeting()}, ${state.user?.FullName || "bạn"}. Theo dõi các lớp bạn phụ trách.`)}
      <div class="stat-grid mb-2">
        <article class="stat-card" style="--accent:var(--pink-500)">
          <div class="stat-label">Lớp phụ trách</div>
          <div class="stat-value">${formatNumber(courses.length)}</div>
          <div class="stat-hint">Học kỳ hiện tại và trước đó</div>
        </article>
        <article class="stat-card" style="--accent:#c11c84">
          <div class="stat-label">Sinh viên</div>
          <div class="stat-value">${formatNumber(totalStudents)}</div>
          <div class="stat-hint">Trên tất cả lớp</div>
        </article>
        <article class="stat-card" style="--accent:#a63d7f">
          <div class="stat-label">Lượt nộp</div>
          <div class="stat-value">${formatNumber(submissions.length)}</div>
          <div class="stat-hint">Bài nộp nhận được</div>
        </article>
        <article class="stat-card" style="--accent:#d76b8f">
          <div class="stat-label">Chờ chấm</div>
          <div class="stat-value">${formatNumber(ungraded)}</div>
          <div class="stat-hint">Bài nộp chưa có điểm</div>
        </article>
      </div>
      <div class="section-title"><div><h2>Lớp tôi dạy</h2><p>Chọn một lớp để quản lý nội dung và điểm.</p></div><a class="btn btn-pink btn-sm" href="#/courses">Xem tất cả</a></div>
      ${courses.length ? `<div class="course-grid list">${courses.slice(0, 6).map((row) => courseCard(row, "staff")).join("")}</div>` : emptyState("Chưa có lớp phụ trách")}`;
    bindCourseClicks();
  }

  async function renderAdminDashboard() {
    let overview = {};
    try {
      const payload = await api("/api/statistics/overview");
      overview = payload.data || {};
    } catch (error) {
      overview = {};
    }
    let users = [];
    try {
      users = (await api("/api/admin/users")).data || [];
    } catch (error) {
      users = [];
    }
    const activeUsers = users.filter((u) => u.AccountStatus === "ACTIVE").length;
    $("#view").innerHTML = `
      ${pageHead("Bảng điều khiển", `${greeting()}, ${state.user?.FullName || "bạn"}. Tổng quan toàn hệ thống.`)}
      <div class="stat-grid mb-2">
        <article class="stat-card" style="--accent:var(--pink-500)"><div class="stat-label">Tài khoản</div><div class="stat-value">${formatNumber(users.length)}</div><div class="stat-hint">${formatNumber(activeUsers)} đang hoạt động</div></article>
        <article class="stat-card" style="--accent:#c11c84"><div class="stat-label">Lớp học phần</div><div class="stat-value">${formatNumber(overview.section_count)}</div><div class="stat-hint">Tất cả học kỳ</div></article>
        <article class="stat-card" style="--accent:#a63d7f"><div class="stat-label">Ghi danh</div><div class="stat-value">${formatNumber(overview.enrollment_count)}</div><div class="stat-hint">${formatNumber(overview.active_enrollment_count)} đang hoạt động</div></article>
        <article class="stat-card" style="--accent:#d76b8f"><div class="stat-label">Điểm đã công bố</div><div class="stat-value">${formatNumber(overview.published_grade_count)}</div><div class="stat-hint">Toàn hệ thống</div></article>
      </div>
      <div class="row g-3 mt-1">
        <div class="col-lg-7">
          <div class="panel h-100">
            <div class="panel-head"><div><h3>Quản trị nhanh</h3><p>Đi thẳng tới nhóm dữ liệu cần thao tác</p></div></div>
            <div class="panel-body stack">
              ${adminQuickLink("users", "user", "Người dùng", "Tạo tài khoản, khóa hoặc mở khóa")}
              ${adminQuickLink("sections", "calendar", "Lớp học phần", "Xếp lịch, phòng học và giảng viên")}
              ${adminQuickLink("courses", "book", "Môn học", "Mã môn, số tín chỉ và khoa")}
              ${adminQuickLink("data", "database", "Dữ liệu", "Khám phá toàn bộ 22 bảng")}
            </div>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="panel h-100">
            <div class="panel-head"><div><h3>Tài khoản theo vai trò</h3><p>Phân bố hiện tại</p></div></div>
            <div class="panel-body stack">
              ${["STUDENT", "STAFF", "ADMIN"].map((role) => {
                const count = users.filter((u) => u.Role === role).length;
                return `<div class="list-row"><div class="list-row-flex"><span class="row-icon">${icon(role === "STUDENT" ? "graduation" : role === "STAFF" ? "users" : "shield")}</span><div class="list-row-main"><div class="list-row-title">${ROLE_LABELS[role]}</div><div class="list-row-meta">${formatNumber(count)} tài khoản</div></div></div></div>`;
              }).join("")}
            </div>
          </div>
        </div>
      </div>`;
  }

  function adminQuickLink(tab, iconName, title, note) {
    return `<a class="list-row text-decoration-none" href="#/admin?tab=${tab}">
      <div class="list-row-flex"><span class="row-icon">${icon(iconName)}</span>
      <div class="list-row-main"><div class="list-row-title">${escapeHtml(title)}</div><div class="list-row-meta">${escapeHtml(note)}</div></div></div>
      <span class="list-row-side cell-muted">${icon("chevron-right")}</span></a>`;
  }
  /* ------------------------------------------------------------------ */
  /* Course list                                                         */
  /* ------------------------------------------------------------------ */
  async function renderCourses() {
    const courses = await loadCourses(true);
    const isStaff = state.role === "STAFF";
    const title = isStaff ? "Lớp tôi dạy" : "Các khoá học của tôi";
    const subtitle = isStaff
      ? "Các lớp học phần bạn là giảng viên phụ trách chính. Chọn một lớp để quản lý nội dung và điểm."
      : "Tổng quan các khoá học bạn đã ghi danh trong học kỳ này và các học kỳ trước.";
    $("#view").innerHTML = `
      ${pageHead(title, subtitle, `<a href="#/dashboard">Trang chủ</a><span>›</span><span>${escapeHtml(title)}</span>`)}
      <section class="overview" aria-label="Bộ lọc khoá học">
        <h2 class="overview-title">Tổng quan về khoá học</h2>
        <div class="overview-toolbar">
          <select class="form-select form-select-sm" id="courseFilter" aria-label="Lọc theo trạng thái">
            <option value="all">Tất cả khoá học</option>
            <option value="inprogress">Đang diễn ra</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="dropped">Đã huỷ</option>
          </select>
          <div class="search-wrap">
            ${icon("search")}
            <input class="form-control form-control-sm" id="courseSearch" type="search" placeholder="Tìm kiếm khoá học" aria-label="Tìm kiếm khoá học">
          </div>
          <select class="form-select form-select-sm" id="courseSort" aria-label="Sắp xếp">
            <option value="name">Sắp xếp theo tên khoá học</option>
            <option value="code">Sắp xếp theo mã môn</option>
            <option value="recent">Học kỳ gần nhất</option>
          </select>
          <div class="view-toggle" role="group" aria-label="Kiểu hiển thị">
            <button type="button" data-view="list" class="active" aria-label="Danh sách">${icon("list")}</button>
            <button type="button" data-view="grid" aria-label="Lưới">${icon("grid")}</button>
          </div>
          ${isStaff ? "" : '<button type="button" class="btn btn-pink btn-sm ms-auto" id="openCatalogBtn">+ Đăng ký môn học</button>'}
        </div>
      </section>
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="cell-muted" id="courseCount"></span>
        <span class="cell-muted" id="courseViewNote"></span>
      </div>
      <div id="courseList"></div>`;

    state.allCourses = courses;
    $("#courseFilter").value = state.courseFilter;
    $("#courseSearch").value = state.search;
    $("#courseSort").value = state.courseSort;
    renderCourseList();

    $("#courseFilter").addEventListener("change", (event) => {
      state.courseFilter = event.target.value;
      renderCourseList();
    });
    $("#courseSearch").addEventListener("input", (event) => {
      state.search = event.target.value;
      renderCourseList();
    });
    $("#courseSort").addEventListener("change", (event) => {
      state.courseSort = event.target.value;
      renderCourseList();
    });
    $$(".view-toggle [data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        state.viewMode = button.dataset.view;
        $$(".view-toggle [data-view]").forEach((item) => item.classList.toggle("active", item === button));
        renderCourseList();
      });
    });
    if (!isStaff) $("#openCatalogBtn").addEventListener("click", openCatalogModal);
    bindCourseClicks();
  }

  function filteredCourses() {
    const courses = state.allCourses || [];
    const isStaff = state.role === "STAFF";
    const query = state.search.trim().toLowerCase();
    let rows = courses.filter((row) => {
      if (query) {
        const haystack = [row.CourseName, row.CourseCode, row.SectionCode, row.InstructorName, row.FacultyName]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (state.courseFilter === "all") return true;
      const status = String(isStaff ? row.SectionStatus : row.EnrollmentStatus || "").toUpperCase();
      if (state.courseFilter === "inprogress") return status === "ACTIVE" || status === "OPEN";
      if (state.courseFilter === "completed") return status === "COMPLETED";
      if (state.courseFilter === "dropped") return status === "DROPPED";
      return true;
    });
    const key = state.courseSort;
    rows = rows.slice().sort((a, b) => {
      if (key === "code") return String(a.CourseCode).localeCompare(String(b.CourseCode), "vi");
      if (key === "recent") {
        const yearDiff = String(b.AcademicYear || "").localeCompare(String(a.AcademicYear || ""));
        return yearDiff !== 0 ? yearDiff : Number(b.TermNo || 0) - Number(a.TermNo || 0);
      }
      return String(a.CourseName).localeCompare(String(b.CourseName), "vi");
    });
    return rows;
  }

  function renderCourseList() {
    const rows = filteredCourses();
    const container = $("#courseList");
    if (!container) return;
    $("#courseCount").textContent = `${formatNumber(rows.length)} khoá học`;
    $("#courseViewNote").textContent = state.role === "STAFF" ? "Vai trò: giảng viên phụ trách" : "Vai trò: sinh viên";
    container.innerHTML = rows.length
      ? `<div class="course-grid ${state.viewMode}">${rows.map((row) => courseCard(row, state.role === "STAFF" ? "staff" : "student")).join("")}</div>`
      : emptyState("Không tìm thấy khoá học", "Thử đổi bộ lọc, từ khoá tìm kiếm hoặc đăng ký môn học mới.", "▤");
    bindCourseClicks();
  }

  function courseCard(row, mode) {
    const staff = mode === "staff";
    const component = row.ComponentName || row.ComponentType || "Học phần";
    const instructor = row.InstructorName || (staff ? state.user?.FullName : "") || "Chưa phân công";
    const faculty = [row.FacultyName, row.FacultyNameEN].filter(Boolean).join(" · ");
    const schedule = row.DayOfWeek
      ? `${dayName(row.DayOfWeek)} ${formatTime(row.StartTime)}–${formatTime(row.EndTime)} · ${row.RoomCode || "—"}`
      : "";
    const extra = staff
      ? `${formatNumber(row.Capacity)} chỗ`
      : `Điểm TB: ${row.AverageScore == null ? "—" : formatPercent(row.AverageScore)}`;
    return `<a class="course-card" href="#/course/${escapeHtml(row.SectionID)}" data-course-id="${escapeHtml(row.SectionID)}">
      <div class="course-thumb ${thumbVariant(row.CourseID || row.SectionID)}">
        <span class="thumb-label">${escapeHtml(row.CourseCode || "BK-LMS")}</span>
      </div>
      <div class="course-body">
        <span class="course-kicker">${escapeHtml(component)} · ${escapeHtml(row.SectionCode || "")}</span>
        <h3 class="course-title">${escapeHtml(row.CourseName || "Khoá học")}</h3>
        <div class="course-meta">${escapeHtml(instructor)}</div>
        ${faculty ? `<div class="course-faculty">${escapeHtml(faculty)}</div>` : ""}
        <div class="course-meta">${escapeHtml(semesterLabel(row))}${schedule ? ` <span class="dot">•</span> ${escapeHtml(schedule)}` : ""}</div>
        <div class="course-faculty">${escapeHtml(extra)}</div>
      </div>
      <div class="course-actions">
        <span class="more-btn" aria-hidden="true">${icon("more")}</span>
      </div>
    </a>`;
  }

  function bindCourseClicks() {
    // Links already navigate via href; nothing else required.
  }

  /* ------------------------------------------------------------------ */
  /* Catalog (student self-enrollment)                                   */
  /* ------------------------------------------------------------------ */
  async function openCatalogModal() {
    const body = openModal({
      title: "Đăng ký môn học",
      size: "lg",
      body: loadingState("Đang tải danh mục lớp học phần…"),
      footer: '<button type="button" class="btn btn-light" data-bs-dismiss="modal">Đóng</button>',
    });
    try {
      const rows = (await api("/api/student/catalog-sections")).data || [];
      body.innerHTML = `<p class="cell-muted mb-3">Chọn lớp học phần còn chỗ. Việc ghi danh đi qua <code>sp_InsertEnrollment</code> và được kiểm tra sĩ số, trùng lặp ở tầng cơ sở dữ liệu.</p>
        <div class="stack">${rows.map((row) => {
          const enrolled = row.EnrollmentID && row.EnrollmentStatus === "ACTIVE";
          const dropped = row.EnrollmentID && row.EnrollmentStatus === "DROPPED";
          const full = Number(row.ActiveEnrollmentCount) >= Number(row.Capacity);
          return `<div class="list-row">
            <div class="list-row-flex">
              <span class="row-icon">${icon("book")}</span>
              <div class="list-row-main">
                <div class="list-row-title">${escapeHtml(row.CourseCode)} · ${escapeHtml(row.CourseName)}</div>
                <div class="list-row-meta">${escapeHtml(row.SectionCode)} · ${escapeHtml(row.ComponentType)} · ${escapeHtml(row.InstructorName || "Chưa có giảng viên")}</div>
                <div class="list-row-meta">${escapeHtml(semesterLabel(row))} · ${escapeHtml(dayName(row.DayOfWeek))} ${formatTime(row.StartTime)}–${formatTime(row.EndTime)} · ${escapeHtml(row.RoomCode || "")}</div>
                <div class="list-row-meta">${formatNumber(row.ActiveEnrollmentCount)}/${formatNumber(row.Capacity)} chỗ · ${escapeHtml(row.FacultyName || "")}</div>
              </div>
            </div>
            <div class="list-row-side">
              ${enrolled
                ? `<span class="badge-soft active">Đã đăng ký</span><button type="button" class="btn btn-light btn-sm" data-drop="${escapeHtml(row.EnrollmentID)}">Huỷ</button>`
                : `<button type="button" class="btn ${full ? "btn-light" : "btn-pink"} btn-sm" data-enroll="${escapeHtml(row.SectionID)}" ${full ? "disabled" : ""}>${dropped ? "Đăng ký lại" : full ? "Hết chỗ" : "Đăng ký"}</button>`}
            </div>
          </div>`;
        }).join("")}</div>`;
      body.querySelectorAll("[data-enroll]").forEach((button) => {
        button.addEventListener("click", async () => {
          const restore = setBusy(button, "Đang đăng ký…");
          try {
            await api("/api/student/enrollments", { method: "POST", body: { section_id: Number(button.dataset.enroll) } });
            notify("Đã đăng ký lớp học phần.", "success");
            state.courses = null;
            await openCatalogModal();
            await render();
          } catch (error) {
            notify(error.message, "danger");
            restore();
          }
        });
      });
      body.querySelectorAll("[data-drop]").forEach((button) => {
        button.addEventListener("click", () => {
          confirmAction("Huỷ đăng ký lớp học phần này? Ghi danh sẽ chuyển sang trạng thái <strong>DROPPED</strong>.", async () => {
            try {
              await api(`/api/student/enrollments/${button.dataset.drop}/drop`, { method: "PATCH" });
              notify("Đã huỷ đăng ký.", "success");
              state.courses = null;
              await openCatalogModal();
              await render();
            } catch (error) {
              notify(error.message, "danger");
            }
          });
        });
      });
    } catch (error) {
      body.innerHTML = errorState(error.message);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Grades                                                              */
  /* ------------------------------------------------------------------ */
  async function renderGrades() {
    const grades = await loadGrades(true);
    const rows = grades.filter((g) => g.IsPublished);
    const byCourse = new Map();
    rows.forEach((grade) => {
      const key = `${grade.CourseCode}||${grade.SectionCode}`;
      if (!byCourse.has(key)) byCourse.set(key, []);
      byCourse.get(key).push(grade);
    });
    $("#view").innerHTML = `
      ${pageHead("Điểm của tôi", "Chỉ các đầu điểm đã được công bố mới hiển thị với sinh viên.", `<a href="#/dashboard">Trang chủ</a><span>›</span><span>Điểm của tôi</span>`)}
      ${rows.length ? `<div class="stack">${[...byCourse.entries()].map(([key, items]) => {
        const [courseCode, sectionCode] = key.split("||");
        const first = items[0];
        const average = items.reduce((sum, item) => sum + (Number(item.ScorePercent) || 0), 0) / items.length;
        return `<div class="panel">
          <div class="panel-head">
            <div><h3>${escapeHtml(courseCode)} · ${escapeHtml(first.CourseName)}</h3><p>${escapeHtml(sectionCode)} · ${escapeHtml(semesterLabel(first))}</p></div>
            <span class="badge-soft">TB ${formatPercent(average)}</span>
          </div>
          <div class="table-responsive"><table class="table">
            <thead><tr><th>Đầu điểm</th><th>Điểm</th><th>Tối đa</th><th>Phần trăm</th><th>Ngày chấm</th></tr></thead>
            <tbody>${items.map((item) => `<tr>
              <td class="cell-primary">${escapeHtml(item.Title)}</td>
              <td class="mono">${formatNumber(item.Score)}</td>
              <td class="mono cell-muted">${formatNumber(item.MaxScore)}</td>
              <td class="mono">${formatPercent(item.ScorePercent)}</td>
              <td class="cell-muted">${escapeHtml(formatDate(item.GradedAt))}</td>
            </tr>`).join("")}</tbody>
          </table></div>
        </div>`;
      }).join("")}</div>` : emptyState("Chưa có điểm nào được công bố", "Khi giảng viên công bố điểm, các đầu điểm sẽ xuất hiện tại đây.", "★")}`;
  }

  /* ------------------------------------------------------------------ */
  /* Profile                                                             */
  /* ------------------------------------------------------------------ */
  async function renderProfile() {
    let profile = null;
    if (state.role === "STUDENT") {
      profile = await loadProfile(true);
    }
    const user = state.user || {};
    const fields = state.role === "STUDENT" && profile
      ? [
          ["Họ và tên", profile.FullName],
          ["Mã số sinh viên", profile.StudentCode],
          ["Email", profile.Email],
          ["Khoa", profile.FacultyName],
          ["Tên khoa (EN)", profile.FacultyNameEN],
          ["Trạng thái tài khoản", profile.AccountStatus],
          ["Đăng nhập gần nhất", formatDate(profile.LastAccessAt)],
        ]
      : [
          ["Họ và tên", user.FullName],
          ["Email", user.Email],
          ["Vai trò", ROLE_LABELS[state.role] || state.role],
          ["Trạng thái tài khoản", user.AccountStatus],
          ["Đăng nhập gần nhất", formatDate(user.LastAccessAt)],
        ];
    $("#view").innerHTML = `
      ${pageHead("Hồ sơ của tôi", "Thông tin tài khoản đang đăng nhập trong phiên demo.", `<a href="#/dashboard">Trang chủ</a><span>›</span><span>Hồ sơ</span>`)}
      <div class="panel">
        <div class="panel-body d-flex align-items-center gap-3">
          <span class="avatar" style="width:64px;height:64px;font-size:1.2rem">${escapeHtml(initials(user.FullName))}</span>
          <div>
            <div class="cell-primary" style="font-size:1.15rem">${escapeHtml(user.FullName || "—")}</div>
            <div class="cell-muted">${escapeHtml(user.Email || "")}</div>
            <span class="badge-soft mt-1">${escapeHtml(ROLE_LABELS[state.role] || state.role || "")}</span>
          </div>
        </div>
      </div>
      <div class="section-title"><h2>Chi tiết</h2></div>
      <div class="profile-grid">${fields.map(([key, value]) => `<div class="detail-item"><div class="k">${escapeHtml(key)}</div><div class="v">${escapeHtml(value == null || value === "" ? "—" : value)}</div></div>`).join("")}</div>`;
  }
  /* ------------------------------------------------------------------ */
  /* Course detail (shared dispatcher)                                   */
  /* ------------------------------------------------------------------ */
  async function renderCourse(sectionId) {
    if (!Number.isFinite(sectionId) || sectionId <= 0) {
      $("#view").innerHTML = errorState("Mã lớp học phần không hợp lệ.");
      return;
    }
    if (state.role === "STAFF") return renderStaffCourse(sectionId);
    return renderStudentCourse(sectionId);
  }

  function field({ id, label, type = "text", value = "", options = null, required = false, span = false, placeholder = "", step = "" }) {
    const req = required ? " required" : "";
    let input;
    if (type === "select") {
      input = `<select class="form-select" id="${id}"${req}>${options
        .map((option) => `<option value="${escapeHtml(option.value)}" ${String(option.value) === String(value) ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
        .join("")}</select>`;
    } else if (type === "textarea") {
      input = `<textarea class="form-control" id="${id}" rows="3"${req} placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea>`;
    } else {
      input = `<input class="form-control" id="${id}" type="${type}" value="${escapeHtml(value)}"${req}${step ? ` step="${step}"` : ""} placeholder="${escapeHtml(placeholder)}">`;
    }
    return `<div class="${span ? "span-2" : ""}"><label class="form-label" for="${id}">${escapeHtml(label)}${required ? ' <span class="text-danger">*</span>' : ""}</label>${input}</div>`;
  }

  function modalFooter(submitId, label = "Lưu") {
    return `<button type="button" class="btn btn-light" data-bs-dismiss="modal">Hủy</button><button type="button" class="btn btn-pink" id="${submitId}">${escapeHtml(label)}</button>`;
  }

  function courseHero(section, extraBadges = []) {
    const badges = [
      semesterLabel(section),
      section.DayOfWeek
        ? `${dayName(section.DayOfWeek)} ${formatTime(section.StartTime)}–${formatTime(section.EndTime)}`
        : "",
      section.RoomCode ? `Phòng ${section.RoomCode}` : "",
      ...extraBadges,
    ].filter(Boolean);
    return `<section class="course-hero">
      <div class="kicker">${escapeHtml(section.ComponentName || section.ComponentType || "Học phần")} · ${escapeHtml(section.SectionCode || "")}</div>
      <h1>${escapeHtml(section.CourseName || "Khoá học")}</h1>
      <p>${escapeHtml(section.CourseCode || "")} · ${escapeHtml(section.InstructorName || state.user?.FullName || "Chưa phân công")}${section.FacultyName ? ` · ${escapeHtml(section.FacultyName)}` : ""}</p>
      <div class="hero-badges">${badges.map((badge) => `<span>${escapeHtml(badge)}</span>`).join("")}</div>
    </section>`;
  }

  function courseCrumbs(section) {
    return `<a href="#/dashboard">Trang chủ</a><span>›</span><a href="#/courses">${state.role === "STAFF" ? "Lớp tôi dạy" : "Các khoá học của tôi"}</a><span>›</span><span>${escapeHtml(section.SectionCode || "")}</span>`;
  }

  function tabsMarkup(tabs, active) {
    return `<div class="tabs" role="tablist">${tabs
      .map((tab) => `<button type="button" role="tab" data-tab="${tab.id}" class="${tab.id === active ? "active" : ""}" aria-selected="${tab.id === active}">${escapeHtml(tab.label)}</button>`)
      .join("")}</div>`;
  }

  function bindTabs(handler, initial) {
    $$("#view .tabs [data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        $$("#view .tabs [data-tab]").forEach((item) => {
          item.classList.toggle("active", item === button);
          item.setAttribute("aria-selected", String(item === button));
        });
        handler(button.dataset.tab);
      });
    });
    handler(initial);
  }

  /* ------------------------------------------------------------------ */
  /* Student course                                                      */
  /* ------------------------------------------------------------------ */
  async function renderStudentCourse(sectionId) {
    const results = await Promise.allSettled([
      api(`/api/student/sections/${sectionId}`),
      api(`/api/student/sections/${sectionId}/announcements`),
      api(`/api/student/sections/${sectionId}/resources`),
      api(`/api/student/sections/${sectionId}/assessments`),
      loadGrades(),
    ]);
    if (results[0].status !== "fulfilled") {
      throw new Error(results[0].reason?.message || "Không mở được lớp học phần.");
    }
    const data = {
      section: results[0].value.data,
      announcements: results[1].status === "fulfilled" ? results[1].value.data || [] : [],
      resources: results[2].status === "fulfilled" ? results[2].value.data || [] : [],
      assessments: results[3].status === "fulfilled" ? results[3].value.data || [] : [],
      grades: results[4].status === "fulfilled" ? results[4].value || [] : [],
    };
    state.studentCourse = data;
    const tabs = [
      { id: "overview", label: "Tổng quan" },
      { id: "announcements", label: "Thông báo" },
      { id: "resources", label: "Tài liệu" },
      { id: "assessments", label: "Bài tập & Quiz" },
      { id: "grades", label: "Điểm" },
    ];
    $("#view").innerHTML = `
      <div class="page-head"><div class="breadcrumb-bar">${courseCrumbs(data.section)}</div></div>
      ${courseHero(data.section, [data.section.EnrollmentStatus || "ACTIVE"])}
      ${tabsMarkup(tabs, state.courseTab)}
      <div id="courseTabContent"></div>`;
    bindTabs(renderStudentCourseTab, state.courseTab);
  }

  function renderStudentCourseTab(tab) {
    state.courseTab = tab;
    const data = state.studentCourse;
    if (!data) return;
    const container = $("#courseTabContent");
    const section = data.section;
    if (tab === "overview") {
      container.innerHTML = `
        <div class="profile-grid mb-3">
          ${detailItem("Số tín chỉ", formatNumber(section.Credits))}
          ${detailItem("Điểm trung bình", section.AverageScore == null ? "—" : formatPercent(section.AverageScore))}
          ${detailItem("Sĩ số", `${formatNumber(section.Capacity)} chỗ`)}
          ${detailItem("Trạng thái lớp", section.SectionStatus)}
          ${detailItem("Ngày ghi danh", formatDate(section.EnrollmentDate))}
          ${detailItem("Giảng viên", section.InstructorName)}
          ${detailItem("Email giảng viên", section.InstructorEmail)}
          ${detailItem("Khoa", [section.FacultyName, section.FacultyNameEN].filter(Boolean).join(" · "))}
        </div>
        <div class="row g-3">
          <div class="col-lg-6">
            <div class="panel h-100">
              <div class="panel-head"><div><h3>Thông báo mới nhất</h3><p>Từ giảng viên phụ trách</p></div></div>
              <div class="panel-body">${announcementList(data.announcements.slice(0, 2))}</div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="panel h-100">
              <div class="panel-head"><div><h3>Tài liệu học tập</h3><p>Tài nguyên được chia sẻ trong lớp</p></div></div>
              <div class="panel-body">${resourceList(data.resources.slice(0, 3))}</div>
            </div>
          </div>
        </div>`;
      return;
    }
    if (tab === "announcements") {
      container.innerHTML = `<div class="panel"><div class="panel-head"><div><h3>Thông báo</h3><p>${formatNumber(data.announcements.length)} thông báo</p></div></div><div class="panel-body">${announcementList(data.announcements)}</div></div>`;
      return;
    }
    if (tab === "resources") {
      container.innerHTML = `<div class="panel"><div class="panel-head"><div><h3>Tài liệu</h3><p>${formatNumber(data.resources.length)} tài liệu</p></div></div><div class="panel-body">${resourceList(data.resources)}</div></div>`;
      return;
    }
    if (tab === "assessments") {
      container.innerHTML = `<div class="panel"><div class="panel-head"><div><h3>Bài tập & Quiz</h3><p>${formatNumber(data.assessments.length)} hoạt động đánh giá</p></div></div><div class="panel-body">
        ${data.assessments.length ? `<div class="stack">${data.assessments.map(assessmentRow).join("")}</div>` : emptyState("Chưa có hoạt động đánh giá")}
      </div></div>`;
      container.querySelectorAll("[data-open-assessment]").forEach((button) => {
        button.addEventListener("click", () => {
          const assessment = data.assessments.find((row) => Number(row.AssessmentID) === Number(button.dataset.openAssessment));
          if (!assessment) return;
          if (assessment.AssessmentType === "QUIZ") openQuizModal(assessment.AssessmentID);
          else openAssignmentModal(assessment.AssessmentID, section.SectionID);
        });
      });
      return;
    }
    if (tab === "grades") {
      const grades = data.grades.filter((grade) => grade.SectionCode === section.SectionCode);
      container.innerHTML = `<div class="panel"><div class="panel-head"><div><h3>Điểm của tôi trong lớp</h3><p>Chỉ đầu điểm đã công bố</p></div></div>
        <div class="table-responsive"><table class="table"><thead><tr><th>Đầu điểm</th><th>Điểm</th><th>Tối đa</th><th>Phần trăm</th><th>Ngày chấm</th></tr></thead>
        <tbody>${grades.length ? grades.map((grade) => `<tr><td class="cell-primary">${escapeHtml(grade.Title)}</td><td class="mono">${formatNumber(grade.Score)}</td><td class="mono cell-muted">${formatNumber(grade.MaxScore)}</td><td class="mono">${formatPercent(grade.ScorePercent)}</td><td class="cell-muted">${escapeHtml(formatDate(grade.GradedAt))}</td></tr>`).join("") : '<tr><td colspan="5" class="cell-muted">Chưa có điểm được công bố.</td></tr>'}</tbody></table></div></div>`;
    }
  }

  function courseMetaText() {
    const section = state.studentCourse?.section || {};
    return [section.CourseCode, section.SectionCode].filter(Boolean).join(" · ");
  }

  function detailItem(key, value) {
    return `<div class="detail-item"><div class="k">${escapeHtml(key)}</div><div class="v">${escapeHtml(value == null || value === "" ? "—" : value)}</div></div>`;
  }

  function announcementList(rows) {
    if (!rows.length) return emptyState("Chưa có thông báo", "", "📣");
    return `<div class="stack">${rows.map((row) => `<div class="list-row">
      <div class="list-row-flex"><span class="row-icon">${icon("megaphone")}</span>
        <div class="list-row-main"><div class="list-row-title">${escapeHtml(row.Title)}</div>
        <div class="list-row-meta">${escapeHtml(formatDate(row.PostedAt))}${row.ExpiredAt ? ` · hết hạn ${escapeHtml(formatDate(row.ExpiredAt))}` : ""}</div>
        <div class="mt-1" style="white-space:pre-line">${escapeHtml(row.Content || "")}</div></div></div>
    </div>`).join("")}</div>`;
  }

  function resourceList(rows) {
    if (!rows.length) return emptyState("Chưa có tài liệu", "", "📄");
    return `<div class="stack">${rows.map((row) => `<div class="list-row">
      <div class="list-row-flex"><span class="row-icon">${icon("file")}</span>
        <div class="list-row-main"><div class="list-row-title">${escapeHtml(row.Title)}</div>
        <div class="list-row-meta">${escapeHtml(row.ResourceType || "Tài liệu")}${row.Description ? ` · ${escapeHtml(row.Description)}` : ""}</div>
        ${row.ResourceURL ? `<a class="cell-muted" href="${escapeHtml(row.ResourceURL)}" target="_blank" rel="noopener">${escapeHtml(row.ResourceURL)}</a>` : ""}</div></div>
    </div>`).join("")}</div>`;
  }

  function assessmentRow(row) {
    const isQuiz = row.AssessmentType === "QUIZ";
    const due = isQuiz ? row.CloseTime : row.DueDate;
    const scored = row.Score != null;
    return `<div class="list-row">
      <div class="list-row-flex">
        <span class="row-icon">${icon(isQuiz ? "clock" : "file")}</span>
        <div class="list-row-main">
          <div class="list-row-title">${escapeHtml(row.Title)}</div>
          <div class="list-row-meta">${isQuiz ? "Quiz" : "Bài tập"} · ${isQuiz ? "Đóng" : "Hạn"}: ${escapeHtml(formatDate(due))}${isQuiz && row.DurationMinutes ? ` · ${formatNumber(row.DurationMinutes)} phút` : ""}</div>
          <div class="list-row-meta">Điểm tối đa ${formatNumber(row.MaxScore)}${row.SubmissionCount != null ? ` · ${formatNumber(row.SubmissionCount)} lượt nộp` : ""}</div>
        </div>
      </div>
      <div class="list-row-side">
        ${scored ? `<span class="badge-soft active">${formatNumber(row.Score)}/${formatNumber(row.MaxScore)}</span>` : '<span class="badge-soft neutral">Chưa chấm</span>'}
        <button type="button" class="btn btn-soft btn-sm" data-open-assessment="${escapeHtml(row.AssessmentID)}">Mở</button>
      </div>
    </div>`;
  }

  /* -------- assignment modal ---------------------------------------- */
  async function openAssignmentModal(assessmentId, sectionId) {
    const body = openModal({
      title: "Chi tiết bài tập",
      size: "lg",
      body: loadingState(),
      footer: '<button type="button" class="btn btn-light" data-bs-dismiss="modal">Đóng</button>',
    });
    try {
      const data = (await api(`/api/student/assignments/${assessmentId}`)).data || {};
      const submissions = data.submissions || [];
      const canSubmit = submissions.length < Number(data.MaxAttempts || 1);
      body.innerHTML = `
        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-2">
          <div>
            <h3 class="h5 mb-1">${escapeHtml(data.Title)}</h3>
            <div class="cell-muted">${escapeHtml(courseMetaText())} · Hạn ${escapeHtml(formatDate(data.DueDate))}</div>
          </div>
          <span class="badge-soft">Tối đa ${formatNumber(data.MaxScore)} điểm</span>
        </div>
        <p style="white-space:pre-line">${escapeHtml(data.Description || "Không có mô tả.")}</p>
        <div class="profile-grid mb-3">
          ${detailItem("Mở lúc", formatDate(data.OpenDate))}
          ${detailItem("Hạn nộp", formatDate(data.DueDate))}
          ${detailItem("Nộp muộn", Number(data.AllowLateSubmission) ? "Được phép" : "Không được phép")}
          ${detailItem("Lượt nộp của bạn", formatNumber(submissions.length))}
        </div>
        ${(data.attachments || []).length ? `<h4 class="h6">Tệp đính kèm</h4><div class="stack mb-3">${data.attachments.map((file) => {
          const url = file.AttachmentURL || "";
          const name = url.split("/").filter(Boolean).pop() || "Tệp đính kèm";
          return `<div class="list-row"><div class="list-row-flex"><span class="row-icon">${icon("file")}</span><div class="list-row-main"><div class="list-row-title">${escapeHtml(name)}</div><div class="list-row-meta">${escapeHtml(url)}</div></div></div></div>`;
        }).join("")}</div>` : ""}
        <h4 class="h6">Bài nộp của bạn</h4>
        ${submissions.length ? `<div class="table-responsive mb-3"><table class="table"><thead><tr><th>Lần</th><th>Nộp lúc</th><th>Trạng thái</th><th>Điểm</th><th>Muộn</th><th>Tệp</th></tr></thead><tbody>${submissions.map((submission) => `<tr>
          <td>${escapeHtml(submission.AttemptNo)}</td>
          <td class="cell-muted">${escapeHtml(formatDate(submission.SubmittedAt))}</td>
          <td>${statusBadge(submission.SubmissionStatus)}</td>
          <td class="mono">${submission.Score == null ? "—" : formatNumber(submission.Score)}</td>
          <td>${Number(submission.IsLate) ? '<span class="badge-soft dropped">Muộn</span>' : '<span class="badge-soft active">Đúng hạn</span>'}</td>
          <td class="cell-muted">${(submission.files || []).map((file) => escapeHtml(file.FileName)).join(", ") || "—"}</td>
        </tr>`).join("")}</tbody></table></div>` : '<p class="cell-muted">Bạn chưa nộp bài lần nào.</p>'}
        <hr>
        ${canSubmit
          ? `<h4 class="h6">Nộp bài mới</h4>
        <div class="field-grid">
          ${field({ id: "subFileName", label: "Tên tệp", value: "bai-nop.pdf", required: true })}
          ${field({ id: "subFileUrl", label: "Đường dẫn tệp", value: "/uploads/bai-nop.pdf", required: true })}
          ${field({ id: "subFileSize", label: "Kích thước (bytes)", type: "number", value: "1024", span: true })}
        </div>
        <p class="cell-muted mt-2 mb-0">Bản demo chỉ lưu metadata tệp trong bảng <code>SubmissionFile</code>, không tải tệp nhị phân thật.</p>`
          : '<p class="cell-muted mb-0">Bạn đã đạt số lần nộp tối đa.</p>'}`;
      $("#appModalFooter").innerHTML = `<button type="button" class="btn btn-light" data-bs-dismiss="modal">Đóng</button>${canSubmit ? '<button type="button" class="btn btn-pink" id="submitAssignmentBtn">Nộp bài</button>' : ""}`;
      if (canSubmit) $("#submitAssignmentBtn").addEventListener("click", async () => {
        const restore = setBusy($("#submitAssignmentBtn"), "Đang nộp…");
        try {
          await api(`/api/student/assignments/${assessmentId}/submissions`, {
            method: "POST",
            body: {
              file_name: $("#subFileName").value.trim(),
              file_url: $("#subFileUrl").value.trim(),
              file_size: Number($("#subFileSize").value) || 0,
            },
          });
          notify("Đã nộp bài.", "success");
          closeModal();
          await renderStudentCourse(sectionId);
        } catch (error) {
          notify(error.message, "danger");
          restore();
        }
      });
    } catch (error) {
      body.innerHTML = errorState(error.message);
    }
  }

  /* -------- quiz modal ----------------------------------------------- */
  async function openQuizModal(assessmentId) {
    const body = openModal({
      title: "Quiz",
      size: "lg",
      body: loadingState(),
      footer: '<button type="button" class="btn btn-light" data-bs-dismiss="modal">Đóng</button>',
    });
    try {
      const data = (await api(`/api/student/quizzes/${assessmentId}`)).data || {};
      const attempts = data.attempts || [];
      body.innerHTML = `
        <h3 class="h5 mb-1">${escapeHtml(data.Title)}</h3>
        <div class="cell-muted mb-3">${escapeHtml(courseMetaText())}</div>
        <p style="white-space:pre-line">${escapeHtml(data.Description || "Không có mô tả.")}</p>
        <div class="profile-grid mb-3">
          ${detailItem("Mở lúc", formatDate(data.OpenTime))}
          ${detailItem("Đóng lúc", formatDate(data.CloseTime))}
          ${detailItem("Thời lượng", `${formatNumber(data.DurationMinutes)} phút`)}
          ${detailItem("Số lượt tối đa", formatNumber(data.MaxAttempts))}
        </div>
        <h4 class="h6">Các lượt làm bài</h4>
        ${attempts.length ? `<div class="table-responsive"><table class="table"><thead><tr><th>Lần</th><th>Bắt đầu</th><th>Kết thúc</th><th>Điểm</th><th></th></tr></thead><tbody>${attempts.map((attempt) => `<tr>
          <td>${escapeHtml(attempt.AttemptNo)}</td>
          <td class="cell-muted">${escapeHtml(formatDate(attempt.StartedAt))}</td>
          <td class="cell-muted">${escapeHtml(formatDate(attempt.FinishedAt))}</td>
          <td class="mono">${attempt.Score == null ? "—" : formatNumber(attempt.Score)}</td>
          <td class="text-end">${attempt.FinishedAt ? "" : `<div class="d-flex gap-1 justify-content-end"><input class="form-control form-control-sm" style="width:80px" type="number" min="0" step="0.1" value="0" id="quiz-score-${attempt.AttemptID}"><button class="btn btn-soft btn-sm" data-finish-attempt="${escapeHtml(attempt.AttemptID)}">Kết thúc</button></div>`}</td>
        </tr>`).join("")}</tbody></table></div>` : '<p class="cell-muted">Bạn chưa làm lượt nào.</p>'}`;
      const canStart = attempts.length < Number(data.MaxAttempts || 1);
      $("#appModalFooter").innerHTML = `<button type="button" class="btn btn-light" data-bs-dismiss="modal">Đóng</button>${canStart ? '<button type="button" class="btn btn-pink" id="startQuizBtn">Bắt đầu lượt mới</button>' : ""}`;
      if (canStart) $("#startQuizBtn").addEventListener("click", async () => {
        const restore = setBusy($("#startQuizBtn"), "Đang tạo lượt…");
        try {
          await api(`/api/student/quizzes/${assessmentId}/attempts`, { method: "POST" });
          notify("Đã bắt đầu lượt làm bài.", "success");
          await openQuizModal(assessmentId);
        } catch (error) {
          notify(error.message, "danger");
          restore();
        }
      });
      body.querySelectorAll("[data-finish-attempt]").forEach((button) => {
        button.addEventListener("click", async () => {
          const scoreInput = $(`#quiz-score-${button.dataset.finishAttempt}`);
          const restore = setBusy(button, "…");
          try {
            await api(`/api/student/quiz-attempts/${button.dataset.finishAttempt}/finish`, {
              method: "PATCH",
              body: { score: Number(scoreInput.value) || 0 },
            });
            notify("Đã kết thúc lượt làm bài.", "success");
            await openQuizModal(assessmentId);
          } catch (error) {
            notify(error.message, "danger");
            restore();
          }
        });
      });
    } catch (error) {
      body.innerHTML = errorState(error.message);
    }
  }
  /* ------------------------------------------------------------------ */
  /* Staff course                                                        */
  /* ------------------------------------------------------------------ */
  async function renderStaffCourse(sectionId) {
    const courses = await loadCourses(true);
    const section = courses.find((row) => Number(row.SectionID) === Number(sectionId));
    if (!section) throw new Error("Bạn không phụ trách lớp học phần này.");
    const results = await Promise.allSettled([
      api(`/api/staff/sections/${sectionId}/students`),
      api(`/api/staff/sections/${sectionId}/announcements`),
      api(`/api/staff/sections/${sectionId}/resources`),
      api(`/api/staff/sections/${sectionId}/assessments`),
      api(`/api/staff/sections/${sectionId}/submissions`),
      api(`/api/staff/sections/${sectionId}/grades`),
      api(`/api/staff/sections/${sectionId}/quiz-attempts`),
    ]);
    const pick = (index) => (results[index].status === "fulfilled" ? results[index].value.data || [] : []);
    const data = {
      section,
      students: pick(0),
      announcements: pick(1),
      resources: pick(2),
      assessments: pick(3),
      submissions: pick(4),
      grades: pick(5),
      attempts: pick(6),
    };
    state.staffCourse = data;
    const tabs = [
      { id: "overview", label: "Tổng quan" },
      { id: "students", label: "Sinh viên" },
      { id: "announcements", label: "Thông báo" },
      { id: "resources", label: "Tài liệu" },
      { id: "assessments", label: "Bài tập & Quiz" },
      { id: "submissions", label: "Bài nộp" },
      { id: "grades", label: "Điểm" },
    ];
    $("#view").innerHTML = `
      <div class="page-head"><div class="breadcrumb-bar">${courseCrumbs(section)}</div></div>
      ${courseHero(section, [`${formatNumber(data.students.length)} sinh viên`])}
      ${tabsMarkup(tabs, state.courseTab)}
      <div id="courseTabContent"></div>`;
    bindTabs(renderStaffCourseTab, state.courseTab);
  }

  function renderStaffCourseTab(tab) {
    state.courseTab = tab;
    const data = state.staffCourse;
    if (!data) return;
    const container = $("#courseTabContent");
    const section = data.section;
    const sectionId = Number(section.SectionID);
    if (tab === "overview") {
      const ungraded = data.submissions.filter((row) => row.Score == null).length;
      container.innerHTML = `
        <div class="stat-grid mb-3">
          <article class="stat-card" style="--accent:var(--pink-500)"><div class="stat-label">Sinh viên</div><div class="stat-value">${formatNumber(data.students.length)}</div><div class="stat-hint">${formatNumber(section.Capacity)} chỗ</div></article>
          <article class="stat-card" style="--accent:#c11c84"><div class="stat-label">Hoạt động</div><div class="stat-value">${formatNumber(data.assessments.length)}</div><div class="stat-hint">Bài tập và quiz</div></article>
          <article class="stat-card" style="--accent:#a63d7f"><div class="stat-label">Bài nộp</div><div class="stat-value">${formatNumber(data.submissions.length)}</div><div class="stat-hint">${formatNumber(ungraded)} chờ chấm</div></article>
          <article class="stat-card" style="--accent:#d76b8f"><div class="stat-label">Đầu điểm</div><div class="stat-value">${formatNumber(data.grades.length)}</div><div class="stat-hint">Đã ghi nhận</div></article>
        </div>
        <div class="panel mb-3">
          <div class="panel-head"><div><h3>Thao tác nhanh</h3><p>Bổ sung nội dung cho lớp</p></div></div>
          <div class="panel-body d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-pink btn-sm" data-add-announcement>${icon("megaphone")} Thông báo</button>
            <button type="button" class="btn btn-soft btn-sm" data-add-resource>${icon("file")} Tài liệu</button>
            <button type="button" class="btn btn-soft btn-sm" data-add-assignment>${icon("file")} Bài tập</button>
            <button type="button" class="btn btn-soft btn-sm" data-add-quiz>${icon("clock")} Quiz</button>
            <button type="button" class="btn btn-soft btn-sm" data-add-grade>${icon("award")} Đầu điểm</button>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><div><h3>Bài nộp gần đây</h3><p>5 lượt nộp mới nhất</p></div><button class="btn btn-light btn-sm" data-go-tab="submissions">Xem tất cả</button></div>
          <div class="panel-body">${submissionsPreview(data.submissions.slice(0, 5))}</div>
        </div>`;
      bindStaffOverviewActions(sectionId, data);
      return;
    }
    if (tab === "students") {
      container.innerHTML = `<div class="panel"><div class="panel-head"><div><h3>Sinh viên trong lớp</h3><p>${formatNumber(data.students.length)} ghi danh</p></div></div>
        <div class="table-responsive"><table class="table"><thead><tr><th>Họ tên</th><th>MSSV</th><th>Email</th><th>Ngày ghi danh</th><th>Trạng thái</th></tr></thead>
        <tbody>${data.students.length ? data.students.map((row) => `<tr><td class="cell-primary">${escapeHtml(row.StudentName)}</td><td>${escapeHtml(row.StudentCode)}</td><td class="cell-muted">${escapeHtml(row.StudentEmail)}</td><td class="cell-muted">${escapeHtml(formatDate(row.EnrollmentDate))}</td><td>${statusBadge(row.EnrollmentStatus)}</td></tr>`).join("") : '<tr><td colspan="5" class="cell-muted">Chưa có sinh viên.</td></tr>'}</tbody></table></div></div>`;
      return;
    }
    if (tab === "announcements") {
      container.innerHTML = `<div class="toolbar"><span class="cell-muted">${formatNumber(data.announcements.length)} thông báo</span><button type="button" class="btn btn-pink btn-sm" data-add-announcement>${icon("plus")} Thêm thông báo</button></div>
        <div class="panel"><div class="panel-body">${staffAnnouncementList(data.announcements, sectionId)}</div></div>`;
      bindAnnouncementActions(sectionId);
      return;
    }
    if (tab === "resources") {
      container.innerHTML = `<div class="toolbar"><span class="cell-muted">${formatNumber(data.resources.length)} tài liệu</span><button type="button" class="btn btn-pink btn-sm" data-add-resource>${icon("plus")} Thêm tài liệu</button></div>
        <div class="panel"><div class="panel-body">${staffResourceList(data.resources, sectionId)}</div></div>`;
      bindResourceActions(sectionId);
      return;
    }
    if (tab === "assessments") {
      container.innerHTML = `<div class="toolbar"><span class="cell-muted">${formatNumber(data.assessments.length)} hoạt động</span>
        <div class="right"><button type="button" class="btn btn-soft btn-sm" data-add-assignment>${icon("plus")} Bài tập</button><button type="button" class="btn btn-pink btn-sm" data-add-quiz>${icon("plus")} Quiz</button></div></div>
        <div class="panel"><div class="panel-body">${staffAssessmentList(data.assessments, sectionId)}</div></div>`;
      bindAssessmentActions(sectionId, data);
      return;
    }
    if (tab === "submissions") {
      container.innerHTML = `<div class="panel"><div class="panel-head"><div><h3>Bài nộp</h3><p>${formatNumber(data.submissions.length)} lượt nộp</p></div></div>
        <div class="table-responsive"><table class="table"><thead><tr><th>Sinh viên</th><th>Bài tập</th><th>Lần</th><th>Nộp lúc</th><th>Điểm</th><th></th></tr></thead>
        <tbody>${data.submissions.length ? data.submissions.map((row) => `<tr>
          <td class="cell-primary">${escapeHtml(row.StudentName)}</td>
          <td>${escapeHtml(row.AssignmentTitle)}</td>
          <td>${escapeHtml(row.AttemptNo)}</td>
          <td class="cell-muted">${escapeHtml(formatDate(row.SubmittedAt))}</td>
          <td class="mono">${row.Score == null ? '<span class="badge-soft neutral">Chưa chấm</span>' : formatNumber(row.Score)}</td>
          <td class="text-end"><button class="btn btn-soft btn-sm" data-grade-submission="${escapeHtml(row.SubmissionID)}" data-student="${escapeHtml(row.StudentName)}" data-title="${escapeHtml(row.AssignmentTitle)}" data-score="${row.Score == null ? "" : escapeHtml(row.Score)}">Chấm điểm</button></td>
        </tr>`).join("") : '<tr><td colspan="6" class="cell-muted">Chưa có bài nộp.</td></tr>'}</tbody></table></div></div>`;
      bindSubmissionActions(sectionId);
      return;
    }
    if (tab === "grades") {
      container.innerHTML = `<div class="toolbar"><span class="cell-muted">${formatNumber(data.grades.length)} đầu điểm</span><button type="button" class="btn btn-pink btn-sm" data-add-grade>${icon("plus")} Ghi đầu điểm</button></div>
        <div class="panel"><div class="table-responsive"><table class="table"><thead><tr><th>Sinh viên</th><th>MSSV</th><th>Đầu điểm</th><th>Điểm</th><th>Tối đa</th><th>Công bố</th><th>Ngày chấm</th></tr></thead>
        <tbody>${data.grades.length ? data.grades.map((row) => `<tr><td class="cell-primary">${escapeHtml(row.StudentName)}</td><td>${escapeHtml(row.StudentCode)}</td><td>${escapeHtml(row.AssessmentTitle)}</td><td class="mono">${formatNumber(row.Score)}</td><td class="mono cell-muted">${formatNumber(row.MaxScore)}</td><td>${Number(row.IsPublished) ? '<span class="badge-soft active">Đã công bố</span>' : '<span class="badge-soft neutral">Ẩn</span>'}</td><td class="cell-muted">${escapeHtml(formatDate(row.GradedAt))}</td></tr>`).join("") : '<tr><td colspan="7" class="cell-muted">Chưa có đầu điểm.</td></tr>'}</tbody></table></div></div>`;
      bindAddGradeAction(sectionId, data);
    }
  }

  function submissionsPreview(rows) {
    if (!rows.length) return emptyState("Chưa có bài nộp");
    return `<div class="stack">${rows.map((row) => `<div class="list-row">
      <div class="list-row-flex"><span class="row-icon">${icon("file")}</span>
        <div class="list-row-main"><div class="list-row-title">${escapeHtml(row.StudentName)}</div>
        <div class="list-row-meta">${escapeHtml(row.AssignmentTitle)} · lần ${escapeHtml(row.AttemptNo)} · ${escapeHtml(formatDate(row.SubmittedAt))}</div></div></div>
      <span class="list-row-side">${row.Score == null ? '<span class="badge-soft neutral">Chưa chấm</span>' : `<span class="badge-soft active">${formatNumber(row.Score)} điểm</span>`}</span>
    </div>`).join("")}</div>`;
  }

  function staffAnnouncementList(rows, sectionId) {
    if (!rows.length) return emptyState("Chưa có thông báo", "", "📣");
    return `<div class="stack">${rows.map((row) => `<div class="list-row">
      <div class="list-row-flex"><span class="row-icon">${icon("megaphone")}</span>
        <div class="list-row-main"><div class="list-row-title">${escapeHtml(row.Title)}</div>
        <div class="list-row-meta">${escapeHtml(formatDate(row.PostedAt))}</div>
        <div class="mt-1" style="white-space:pre-line">${escapeHtml(row.Content || "")}</div></div></div>
      <span class="list-row-side"><button class="btn btn-light btn-sm" data-del-announcement="${escapeHtml(row.AnnouncementID)}">Xóa</button></span>
    </div>`).join("")}</div>`;
  }

  function staffResourceList(rows, sectionId) {
    if (!rows.length) return emptyState("Chưa có tài liệu", "", "📄");
    return `<div class="stack">${rows.map((row) => `<div class="list-row">
      <div class="list-row-flex"><span class="row-icon">${icon("file")}</span>
        <div class="list-row-main"><div class="list-row-title">${escapeHtml(row.Title)}</div>
        <div class="list-row-meta">${escapeHtml(row.ResourceType || "Tài liệu")} · ${escapeHtml(row.ResourceURL || "")}</div></div></div>
      <span class="list-row-side"><button class="btn btn-light btn-sm" data-unpost="${escapeHtml(row.ResourceID)}">Gỡ</button></span>
    </div>`).join("")}</div>`;
  }

  function staffAssessmentList(rows, sectionId) {
    if (!rows.length) return emptyState("Chưa có bài tập hoặc quiz");
    return `<div class="stack">${rows.map((row) => {
      const isQuiz = row.AssessmentType === "QUIZ";
      const due = isQuiz ? row.CloseTime : row.DueDate;
      return `<div class="list-row">
        <div class="list-row-flex"><span class="row-icon">${icon(isQuiz ? "clock" : "file")}</span>
          <div class="list-row-main"><div class="list-row-title">${escapeHtml(row.Title)}</div>
          <div class="list-row-meta">${isQuiz ? "Quiz" : "Bài tập"} · ${escapeHtml(formatDate(due))} · tối đa ${formatNumber(row.MaxScore)} điểm${!isQuiz ? ` · ${formatNumber(row.SubmissionCount)} lượt nộp` : ""}</div></div></div>
        <span class="list-row-side"><button class="btn btn-light btn-sm" data-del-assessment="${escapeHtml(row.AssessmentID)}">Xóa</button></span>
      </div>`;
    }).join("")}</div>`;
  }

  function bindStaffOverviewActions(sectionId, data) {
    const container = $("#courseTabContent");
    container.querySelector("[data-add-announcement]")?.addEventListener("click", () => openAnnouncementModal(sectionId));
    container.querySelector("[data-add-resource]")?.addEventListener("click", () => openResourceModal(sectionId));
    container.querySelector("[data-add-assignment]")?.addEventListener("click", () => openAssignmentCreateModal(sectionId));
    container.querySelector("[data-add-quiz]")?.addEventListener("click", () => openQuizCreateModal(sectionId));
    container.querySelector("[data-add-grade]")?.addEventListener("click", () => openUpsertGradeModal(sectionId, data));
    container.querySelector("[data-go-tab]")?.addEventListener("click", () => {
      $$("#view .tabs [data-tab]").forEach((item) => item.classList.toggle("active", item.dataset.tab === "submissions"));
      renderStaffCourseTab("submissions");
    });
  }

  function bindAnnouncementActions(sectionId) {
    const container = $("#courseTabContent");
    container.querySelector("[data-add-announcement]")?.addEventListener("click", () => openAnnouncementModal(sectionId));
    container.querySelectorAll("[data-del-announcement]").forEach((button) => {
      button.addEventListener("click", () => {
        confirmAction("Xóa thông báo này khỏi lớp?", async () => {
          try {
            await api(`/api/staff/announcements/${button.dataset.delAnnouncement}`, { method: "DELETE" });
            notify("Đã xóa thông báo.", "success");
            await renderStaffCourse(sectionId);
          } catch (error) {
            notify(error.message, "danger");
          }
        });
      });
    });
  }

  function bindResourceActions(sectionId) {
    const container = $("#courseTabContent");
    container.querySelector("[data-add-resource]")?.addEventListener("click", () => openResourceModal(sectionId));
    container.querySelectorAll("[data-unpost]").forEach((button) => {
      button.addEventListener("click", () => {
        confirmAction("Gỡ tài liệu này khỏi lớp?", async () => {
          try {
            await api(`/api/staff/sections/${sectionId}/resources/${button.dataset.unpost}`, { method: "DELETE" });
            notify("Đã gỡ tài liệu.", "success");
            await renderStaffCourse(sectionId);
          } catch (error) {
            notify(error.message, "danger");
          }
        });
      });
    });
  }

  function bindAssessmentActions(sectionId, data) {
    const container = $("#courseTabContent");
    container.querySelector("[data-add-assignment]")?.addEventListener("click", () => openAssignmentCreateModal(sectionId));
    container.querySelector("[data-add-quiz]")?.addEventListener("click", () => openQuizCreateModal(sectionId));
    container.querySelectorAll("[data-del-assessment]").forEach((button) => {
      button.addEventListener("click", () => {
        confirmAction("Xóa hoạt động đánh giá này? Các bài nộp và điểm liên quan có thể bị ảnh hưởng.", async () => {
          try {
            await api(`/api/staff/assessments/${button.dataset.delAssessment}`, { method: "DELETE" });
            notify("Đã xóa hoạt động.", "success");
            await renderStaffCourse(sectionId);
          } catch (error) {
            notify(error.message, "danger");
          }
        });
      });
    });
  }

  function bindSubmissionActions(sectionId) {
    $$("#courseTabContent [data-grade-submission]").forEach((button) => {
      button.addEventListener("click", () => {
        openGradeModal(sectionId, {
          id: button.dataset.gradeSubmission,
          student: button.dataset.student,
          title: button.dataset.title,
          score: button.dataset.score,
        });
      });
    });
  }

  function bindAddGradeAction(sectionId, data) {
    $("#courseTabContent [data-add-grade]")?.addEventListener("click", () => openUpsertGradeModal(sectionId, data));
  }

  /* -------- staff modals -------------------------------------------- */
  function openAnnouncementModal(sectionId) {
    const body = openModal({
      title: "Thêm thông báo",
      body: `<div class="field-grid">
        ${field({ id: "annTitle", label: "Tiêu đề", required: true, span: true })}
        ${field({ id: "annContent", label: "Nội dung", type: "textarea", required: true, span: true })}
        ${field({ id: "annExpired", label: "Hết hạn lúc", type: "datetime-local", span: true })}
      </div>`,
      footer: modalFooter("saveAnnouncement", "Đăng thông báo"),
    });
    $("#saveAnnouncement").addEventListener("click", async () => {
      const restore = setBusy($("#saveAnnouncement"), "Đang đăng…");
      try {
        await api(`/api/staff/sections/${sectionId}/announcements`, {
          method: "POST",
          body: {
            title: $("#annTitle").value.trim(),
            content: $("#annContent").value.trim(),
            expired_at: toMysqlDateTime($("#annExpired").value) || null,
          },
        });
        notify("Đã đăng thông báo.", "success");
        closeModal();
        await renderStaffCourse(sectionId);
      } catch (error) {
        notify(error.message, "danger");
        restore();
      }
    });
  }

  function openResourceModal(sectionId) {
    const body = openModal({
      title: "Thêm tài liệu",
      body: `<div class="field-grid">
        ${field({ id: "resTitle", label: "Tiêu đề", required: true, span: true })}
        ${field({ id: "resDescription", label: "Mô tả", type: "textarea", span: true })}
        ${field({ id: "resType", label: "Loại tài liệu", type: "select", value: "DOCUMENT", options: [
          { value: "DOCUMENT", label: "Tài liệu" },
          { value: "SLIDE", label: "Bài giảng" },
          { value: "VIDEO", label: "Video" },
          { value: "LINK", label: "Liên kết" },
        ] })}
        ${field({ id: "resUrl", label: "Đường dẫn", value: "/resources/tai-lieu.pdf", required: true })}
      </div>`,
      footer: modalFooter("saveResource", "Thêm tài liệu"),
    });
    $("#saveResource").addEventListener("click", async () => {
      const restore = setBusy($("#saveResource"), "Đang thêm…");
      try {
        await api(`/api/staff/sections/${sectionId}/resources`, {
          method: "POST",
          body: {
            title: $("#resTitle").value.trim(),
            description: $("#resDescription").value.trim(),
            resource_type: $("#resType").value,
            resource_url: $("#resUrl").value.trim(),
            display_order: 0,
          },
        });
        notify("Đã thêm tài liệu.", "success");
        closeModal();
        await renderStaffCourse(sectionId);
      } catch (error) {
        notify(error.message, "danger");
        restore();
      }
    });
  }

  function openAssignmentCreateModal(sectionId) {
    const body = openModal({
      title: "Tạo bài tập",
      body: `<div class="field-grid">
        ${field({ id: "asgTitle", label: "Tiêu đề", required: true, span: true })}
        ${field({ id: "asgDescription", label: "Mô tả", type: "textarea", span: true })}
        ${field({ id: "asgMaxScore", label: "Điểm tối đa", type: "number", value: "10", step: "0.1", required: true })}
        ${field({ id: "asgMaxAttempts", label: "Số lần nộp tối đa", type: "number", value: "3", required: true })}
        ${field({ id: "asgOpen", label: "Mở lúc", type: "datetime-local", required: true })}
        ${field({ id: "asgDue", label: "Hạn nộp", type: "datetime-local", required: true })}
        ${field({ id: "asgLate", label: "Cho phép nộp muộn", type: "select", value: "1", options: [
          { value: "1", label: "Có" }, { value: "0", label: "Không" },
        ], span: true })}
      </div>`,
      footer: modalFooter("saveAssignment", "Tạo bài tập"),
    });
    $("#saveAssignment").addEventListener("click", async () => {
      const restore = setBusy($("#saveAssignment"), "Đang tạo…");
      try {
        await api(`/api/staff/sections/${sectionId}/assignments`, {
          method: "POST",
          body: {
            title: $("#asgTitle").value.trim(),
            description: $("#asgDescription").value.trim(),
            max_score: Number($("#asgMaxScore").value) || 10,
            max_attempts: Number($("#asgMaxAttempts").value) || 3,
            open_date: toMysqlDateTime($("#asgOpen").value),
            due_date: toMysqlDateTime($("#asgDue").value),
            allow_late: $("#asgLate").value === "1",
            attachments: [],
          },
        });
        notify("Đã tạo bài tập.", "success");
        closeModal();
        await renderStaffCourse(sectionId);
      } catch (error) {
        notify(error.message, "danger");
        restore();
      }
    });
  }

  function openQuizCreateModal(sectionId) {
    const body = openModal({
      title: "Tạo quiz",
      body: `<div class="field-grid">
        ${field({ id: "quizTitle", label: "Tiêu đề", required: true, span: true })}
        ${field({ id: "quizDescription", label: "Mô tả", type: "textarea", span: true })}
        ${field({ id: "quizMaxScore", label: "Điểm tối đa", type: "number", value: "10", step: "0.1", required: true })}
        ${field({ id: "quizDuration", label: "Thời lượng (phút)", type: "number", value: "45", required: true })}
        ${field({ id: "quizOpen", label: "Mở lúc", type: "datetime-local", required: true })}
        ${field({ id: "quizClose", label: "Đóng lúc", type: "datetime-local", required: true })}
      </div>`,
      footer: modalFooter("saveQuiz", "Tạo quiz"),
    });
    $("#saveQuiz").addEventListener("click", async () => {
      const restore = setBusy($("#saveQuiz"), "Đang tạo…");
      try {
        await api(`/api/staff/sections/${sectionId}/quizzes`, {
          method: "POST",
          body: {
            title: $("#quizTitle").value.trim(),
            description: $("#quizDescription").value.trim(),
            max_score: Number($("#quizMaxScore").value) || 10,
            max_attempts: 3,
            open_time: toMysqlDateTime($("#quizOpen").value),
            close_time: toMysqlDateTime($("#quizClose").value),
            duration: Number($("#quizDuration").value) || 45,
          },
        });
        notify("Đã tạo quiz.", "success");
        closeModal();
        await renderStaffCourse(sectionId);
      } catch (error) {
        notify(error.message, "danger");
        restore();
      }
    });
  }

  function openGradeModal(sectionId, submission) {
    const body = openModal({
      title: "Chấm điểm bài nộp",
      body: `<div class="mb-3"><div class="cell-primary">${escapeHtml(submission.student)}</div><div class="cell-muted">${escapeHtml(submission.title)}</div></div>
        ${field({ id: "gradeScore", label: "Điểm", type: "number", value: submission.score || "0", step: "0.1", required: true })}`,
      footer: modalFooter("saveGrade", "Lưu điểm"),
    });
    $("#saveGrade").addEventListener("click", async () => {
      const restore = setBusy($("#saveGrade"), "Đang lưu…");
      try {
        await api(`/api/staff/submissions/${submission.id}/grade`, {
          method: "PATCH",
          body: { score: Number($("#gradeScore").value) || 0 },
        });
        notify("Đã chấm điểm.", "success");
        closeModal();
        await renderStaffCourse(sectionId);
      } catch (error) {
        notify(error.message, "danger");
        restore();
      }
    });
  }

  function openUpsertGradeModal(sectionId, data) {
    const studentOptions = data.students
      .filter((row) => row.EnrollmentStatus === "ACTIVE")
      .map((row) => ({ value: row.EnrollmentID, label: `${row.StudentCode} — ${row.StudentName}` }));
    const assessmentOptions = data.assessments.map((row) => ({ value: row.AssessmentID, label: `${row.Title} (tối đa ${row.MaxScore})` }));
    if (!studentOptions.length || !assessmentOptions.length) {
      notify("Cần có sinh viên và hoạt động đánh giá trước khi ghi điểm.", "warning");
      return;
    }
    const body = openModal({
      title: "Ghi đầu điểm",
      body: `<div class="field-grid">
        ${field({ id: "upsertEnrollment", label: "Sinh viên", type: "select", options: studentOptions, span: true })}
        ${field({ id: "upsertAssessment", label: "Đầu điểm", type: "select", options: assessmentOptions, span: true })}
        ${field({ id: "upsertScore", label: "Điểm", type: "number", value: "0", step: "0.1", required: true })}
        ${field({ id: "upsertPublished", label: "Công bố cho sinh viên", type: "select", value: "1", options: [
          { value: "1", label: "Có" }, { value: "0", label: "Không" },
        ] })}
      </div>`,
      footer: modalFooter("saveUpsertGrade", "Lưu đầu điểm"),
    });
    $("#saveUpsertGrade").addEventListener("click", async () => {
      const restore = setBusy($("#saveUpsertGrade"), "Đang lưu…");
      try {
        await api(`/api/staff/sections/${sectionId}/grades`, {
          method: "POST",
          body: {
            enrollment_id: Number($("#upsertEnrollment").value),
            assessment_id: Number($("#upsertAssessment").value),
            score: Number($("#upsertScore").value) || 0,
            published: $("#upsertPublished").value === "1",
          },
        });
        notify("Đã lưu đầu điểm.", "success");
        closeModal();
        await renderStaffCourse(sectionId);
      } catch (error) {
        notify(error.message, "danger");
        restore();
      }
    });
  }
  /* ------------------------------------------------------------------ */
  /* Admin                                                               */
  /* ------------------------------------------------------------------ */
  const ADMIN_TABS = [
    { id: "users", label: "Người dùng" },
    { id: "faculties", label: "Khoa" },
    { id: "semesters", label: "Học kỳ" },
    { id: "courses", label: "Môn học" },
    { id: "components", label: "Thành phần" },
    { id: "sections", label: "Lớp học phần" },
    { id: "enrollments", label: "Ghi danh" },
    { id: "statistics", label: "Thống kê" },
    { id: "data", label: "Dữ liệu" },
  ];

  async function renderAdmin(tab) {
    state.adminTab = tab;
    $("#view").innerHTML = `
      ${pageHead("Quản trị hệ thống", "Quản lý tài khoản, danh mục đào tạo và khám phá dữ liệu của 22 bảng BTL1.", `<a href="#/dashboard">Trang chủ</a><span>›</span><span>Quản trị</span>`)}
      <div class="admin-tabs" role="tablist">${ADMIN_TABS.map((item) => `<a role="tab" href="#/admin?tab=${item.id}" class="${item.id === tab ? "active" : ""}">${escapeHtml(item.label)}</a>`).join("")}</div>
      <div id="adminContent">${loadingState()}</div>`;
    await loadAdminTab(tab);
  }

  async function loadAdminReferences() {
    if (state.adminCache.references) return state.adminCache.references;
    const results = await Promise.allSettled([
      api("/api/admin/users"),
      api("/api/admin/faculties"),
      api("/api/admin/semesters"),
      api("/api/admin/courses"),
      api("/api/admin/components"),
    ]);
    const value = (index) => (results[index].status === "fulfilled" ? results[index].value.data || [] : []);
    state.adminCache.references = {
      users: value(0),
      faculties: value(1),
      semesters: value(2),
      courses: value(3),
      components: value(4),
    };
    return state.adminCache.references;
  }

  async function loadAdminTab(tab) {
    const content = $("#adminContent");
    if (!content) return;
    content.innerHTML = loadingState();
    try {
      const refs = await loadAdminReferences();
      if (tab === "users") {
        renderAdminUsers(content, refs);
      } else if (tab === "faculties") {
        renderAdminFaculties(content, refs);
      } else if (tab === "semesters") {
        renderAdminSemesters(content, refs);
      } else if (tab === "courses") {
        renderAdminCourses(content, refs);
      } else if (tab === "components") {
        renderAdminComponents(content, refs);
      } else if (tab === "sections") {
        renderAdminSections(content, refs);
      } else if (tab === "enrollments") {
        await renderAdminEnrollments(content, refs);
      } else if (tab === "statistics") {
        await renderAdminStatistics(content, refs);
      } else if (tab === "data") {
        renderAdminData(content);
      }
    } catch (error) {
      content.innerHTML = errorState(error.message);
    }
  }

  function adminToolbar(title, note, addLabel, addId) {
    return `<div class="toolbar"><div><strong>${escapeHtml(title)}</strong> <span class="cell-muted">${escapeHtml(note)}</span></div>
      ${addLabel ? `<button type="button" class="btn btn-pink btn-sm" id="${addId}">${icon("plus")} ${escapeHtml(addLabel)}</button>` : ""}</div>`;
  }

  function refreshAdmin(tab) {
    state.adminCache.references = null;
    if (["sections", "data", "enrollments", "statistics"].includes(tab)) {
      state.adminCache.sections = null;
    }
    return loadAdminTab(tab);
  }

  async function ensureAdminSections() {
    if (state.adminCache.sections) return state.adminCache.sections;
    const payload = await api("/api/admin/sections");
    state.adminCache.sections = payload.data || [];
    return state.adminCache.sections;
  }

  /* -------- users ---------------------------------------------------- */
  function renderAdminUsers(content, refs) {
    const users = refs.users;
    content.innerHTML = `
      ${adminToolbar("Tài khoản", `${formatNumber(users.length)} tài khoản`, "Thêm tài khoản", "addUserBtn")}
      <div class="panel"><div class="table-responsive"><table class="table">
        <thead><tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th class="text-end">Thao tác</th></tr></thead>
        <tbody>${users.map((user) => `<tr>
          <td class="mono">${escapeHtml(user.UserID)}</td>
          <td class="cell-primary">${escapeHtml(user.FullName)}</td>
          <td class="cell-muted">${escapeHtml(user.Email)}</td>
          <td>${escapeHtml(ROLE_LABELS[user.Role] || user.Role)}</td>
          <td>${statusBadge(user.AccountStatus)}</td>
          <td class="text-end text-nowrap">
            <button class="btn btn-light btn-sm" data-user-status="${escapeHtml(user.UserID)}" data-next="${user.AccountStatus === "ACTIVE" ? "LOCKED" : "ACTIVE"}">${user.AccountStatus === "ACTIVE" ? "Khóa" : "Mở khóa"}</button>
          </td>
        </tr>`).join("")}</tbody>
      </table></div></div>`;
    $("#addUserBtn").addEventListener("click", () => openUserModal(refs));
    content.querySelectorAll("[data-user-status]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = button.dataset.next;
        confirmAction(`Đổi trạng thái tài khoản sang <strong>${next}</strong>?`, async () => {
          try {
            await api(`/api/admin/users/${button.dataset.userStatus}/status`, { method: "PATCH", body: { status: next } });
            notify("Đã cập nhật trạng thái tài khoản.", "success");
            await refreshAdmin("users");
          } catch (error) {
            notify(error.message, "danger");
          }
        }, { danger: next === "LOCKED", label: next === "LOCKED" ? "Khóa" : "Mở khóa" });
      });
    });
  }

  function openUserModal(refs) {
    const facultyOptions = refs.faculties.map((row) => ({ value: row.FacultyID, label: row.FacultyName }));
    openModal({
      title: "Thêm tài khoản",
      body: `<div class="field-grid">
        ${field({ id: "userFullName", label: "Họ và tên", required: true, span: true })}
        ${field({ id: "userEmail", label: "Email", type: "email", required: true, span: true })}
        ${field({ id: "userRole", label: "Vai trò", type: "select", options: [
          { value: "STUDENT", label: "Sinh viên" },
          { value: "STAFF", label: "Cán bộ" },
          { value: "ADMIN", label: "Quản trị viên" },
        ] })}
        ${field({ id: "userStudentCode", label: "Mã số sinh viên", placeholder: "VD: 2210999" })}
        ${field({ id: "userFaculty", label: "Khoa (cho sinh viên)", type: "select", options: facultyOptions, span: true })}
      </div>`,
      footer: modalFooter("saveUser", "Tạo tài khoản"),
    });
    $("#saveUser").addEventListener("click", async () => {
      const role = $("#userRole").value;
      const body = {
        full_name: $("#userFullName").value.trim(),
        email: $("#userEmail").value.trim(),
        role,
      };
      if (role === "STUDENT" || role === "STAFF") {
        body.faculty_id = Number($("#userFaculty").value) || 0;
        if (!body.faculty_id) {
          notify("Chọn khoa cho tài khoản.", "warning");
          return;
        }
      }
      if (role === "STUDENT") {
        body.student_code = $("#userStudentCode").value.trim();
        if (!body.student_code) {
          notify("Nhập mã số sinh viên.", "warning");
          return;
        }
      }
      const restore = setBusy($("#saveUser"), "Đang tạo…");
      try {
        await api("/api/admin/users", { method: "POST", body });
        notify("Đã tạo tài khoản.", "success");
        closeModal();
        await refreshAdmin("users");
      } catch (error) {
        notify(error.message, "danger");
        restore();
      }
    });
  }

  /* -------- faculties ------------------------------------------------ */
  function renderAdminFaculties(content, refs) {
    const rows = refs.faculties;
    content.innerHTML = `
      ${adminToolbar("Khoa", `${formatNumber(rows.length)} khoa`, "Thêm khoa", "addFacultyBtn")}
      <div class="panel"><div class="table-responsive"><table class="table">
        <thead><tr><th>ID</th><th>Tên khoa</th><th>Tên tiếng Anh</th><th class="text-end">Thao tác</th></tr></thead>
        <tbody>${rows.map((row) => `<tr><td class="mono">${escapeHtml(row.FacultyID)}</td><td class="cell-primary">${escapeHtml(row.FacultyName)}</td><td class="cell-muted">${escapeHtml(row.FacultyNameEN || "")}</td>
          <td class="text-end text-nowrap"><button class="btn btn-light btn-sm" data-edit-faculty="${escapeHtml(row.FacultyID)}">Sửa</button> <button class="btn btn-light btn-sm" data-del-faculty="${escapeHtml(row.FacultyID)}">Xóa</button></td></tr>`).join("")}</tbody>
      </table></div></div>`;
    $("#addFacultyBtn").addEventListener("click", () => openFacultyModal());
    content.querySelectorAll("[data-edit-faculty]").forEach((button) => {
      const row = rows.find((item) => Number(item.FacultyID) === Number(button.dataset.editFaculty));
      button.addEventListener("click", () => openFacultyModal(row));
    });
    content.querySelectorAll("[data-del-faculty]").forEach((button) => {
      button.addEventListener("click", () => deleteAdminRow("faculties", button.dataset.delFaculty, "khoa"));
    });
  }

  function openFacultyModal(row = null) {
    openModal({
      title: row ? "Sửa khoa" : "Thêm khoa",
      body: `<div class="field-grid">
        ${field({ id: "facultyName", label: "Tên khoa", value: row?.FacultyName || "", required: true, span: true })}
        ${field({ id: "facultyNameEn", label: "Tên tiếng Anh", value: row?.FacultyNameEN || "", span: true })}
      </div>`,
      footer: modalFooter("saveFaculty"),
    });
    $("#saveFaculty").addEventListener("click", async () => {
      const body = { name: $("#facultyName").value.trim(), name_en: $("#facultyNameEn").value.trim() || null };
      const restore = setBusy($("#saveFaculty"), "Đang lưu…");
      try {
        if (row) await api(`/api/admin/faculties/${row.FacultyID}`, { method: "PUT", body });
        else await api("/api/admin/faculties", { method: "POST", body });
        notify("Đã lưu khoa.", "success");
        closeModal();
        await refreshAdmin("faculties");
      } catch (error) {
        notify(error.message, "danger");
        restore();
      }
    });
  }

  /* -------- semesters ------------------------------------------------ */
  function renderAdminSemesters(content, refs) {
    const rows = refs.semesters;
    content.innerHTML = `
      ${adminToolbar("Học kỳ", `${formatNumber(rows.length)} học kỳ`, "Thêm học kỳ", "addSemesterBtn")}
      <div class="panel"><div class="table-responsive"><table class="table">
        <thead><tr><th>ID</th><th>Năm học</th><th>Kỳ</th><th>Bắt đầu</th><th>Kết thúc</th><th class="text-end">Thao tác</th></tr></thead>
        <tbody>${rows.map((row) => `<tr><td class="mono">${escapeHtml(row.SemesterID)}</td><td class="cell-primary">${escapeHtml(row.AcademicYear)}</td><td>${escapeHtml(row.TermNo)}</td><td class="cell-muted">${escapeHtml(formatDate(row.StartDate))}</td><td class="cell-muted">${escapeHtml(formatDate(row.EndDate))}</td>
          <td class="text-end text-nowrap"><button class="btn btn-light btn-sm" data-edit-semester="${escapeHtml(row.SemesterID)}">Sửa</button> <button class="btn btn-light btn-sm" data-del-semester="${escapeHtml(row.SemesterID)}">Xóa</button></td></tr>`).join("")}</tbody>
      </table></div></div>`;
    $("#addSemesterBtn").addEventListener("click", () => openSemesterModal());
    content.querySelectorAll("[data-edit-semester]").forEach((button) => {
      const row = rows.find((item) => Number(item.SemesterID) === Number(button.dataset.editSemester));
      button.addEventListener("click", () => openSemesterModal(row));
    });
    content.querySelectorAll("[data-del-semester]").forEach((button) => {
      button.addEventListener("click", () => deleteAdminRow("semesters", button.dataset.delSemester, "học kỳ"));
    });
  }

  function openSemesterModal(row = null) {
    openModal({
      title: row ? "Sửa học kỳ" : "Thêm học kỳ",
      body: `<div class="field-grid">
        ${field({ id: "semYear", label: "Năm học", value: row?.AcademicYear || "2026-2027", placeholder: "2026-2027", required: true })}
        ${field({ id: "semTerm", label: "Kỳ", type: "number", value: row?.TermNo || 1, required: true })}
        ${field({ id: "semStart", label: "Ngày bắt đầu", type: "date", value: row ? String(row.StartDate).slice(0, 10) : "", required: true })}
        ${field({ id: "semEnd", label: "Ngày kết thúc", type: "date", value: row ? String(row.EndDate).slice(0, 10) : "", required: true })}
      </div>`,
      footer: modalFooter("saveSemester"),
    });
    $("#saveSemester").addEventListener("click", async () => {
      const body = {
        academic_year: $("#semYear").value.trim(),
        term_no: Number($("#semTerm").value) || 1,
        start_date: $("#semStart").value,
        end_date: $("#semEnd").value,
      };
      const restore = setBusy($("#saveSemester"), "Đang lưu…");
      try {
        if (row) await api(`/api/admin/semesters/${row.SemesterID}`, { method: "PUT", body });
        else await api("/api/admin/semesters", { method: "POST", body });
        notify("Đã lưu học kỳ.", "success");
        closeModal();
        await refreshAdmin("semesters");
      } catch (error) {
        notify(error.message, "danger");
        restore();
      }
    });
  }

  /* -------- courses -------------------------------------------------- */
  function renderAdminCourses(content, refs) {
    const rows = refs.courses;
    content.innerHTML = `
      ${adminToolbar("Môn học", `${formatNumber(rows.length)} môn`, "Thêm môn học", "addCourseBtn")}
      <div class="panel"><div class="table-responsive"><table class="table">
        <thead><tr><th>ID</th><th>Mã môn</th><th>Tên môn</th><th>Tín chỉ</th><th>Khoa</th><th class="text-end">Thao tác</th></tr></thead>
        <tbody>${rows.map((row) => `<tr><td class="mono">${escapeHtml(row.CourseID)}</td><td class="cell-primary">${escapeHtml(row.CourseCode)}</td><td>${escapeHtml(row.CourseName)}</td><td>${escapeHtml(row.Credits)}</td><td class="cell-muted">${escapeHtml(row.FacultyName || "")}</td>
          <td class="text-end text-nowrap"><button class="btn btn-light btn-sm" data-edit-course="${escapeHtml(row.CourseID)}">Sửa</button> <button class="btn btn-light btn-sm" data-del-course="${escapeHtml(row.CourseID)}">Xóa</button></td></tr>`).join("")}</tbody>
      </table></div></div>`;
    $("#addCourseBtn").addEventListener("click", () => openCourseModal(refs));
    content.querySelectorAll("[data-edit-course]").forEach((button) => {
      const row = rows.find((item) => Number(item.CourseID) === Number(button.dataset.editCourse));
      button.addEventListener("click", () => openCourseModal(refs, row));
    });
    content.querySelectorAll("[data-del-course]").forEach((button) => {
      button.addEventListener("click", () => deleteAdminRow("courses", button.dataset.delCourse, "môn học"));
    });
  }

  function openCourseModal(refs, row = null) {
    const options = refs.faculties.map((faculty) => ({ value: faculty.FacultyID, label: faculty.FacultyName }));
    openModal({
      title: row ? "Sửa môn học" : "Thêm môn học",
      body: `<div class="field-grid">
        ${field({ id: "courseCode", label: "Mã môn", value: row?.CourseCode || "", required: true })}
        ${field({ id: "courseCredits", label: "Số tín chỉ", type: "number", value: row?.Credits || 3, required: true })}
        ${field({ id: "courseName", label: "Tên môn", value: row?.CourseName || "", required: true, span: true })}
        ${field({ id: "courseFaculty", label: "Khoa", type: "select", value: row?.FacultyID || refs.faculties[0]?.FacultyID, options, span: true })}
      </div>`,
      footer: modalFooter("saveCourse"),
    });
    $("#saveCourse").addEventListener("click", async () => {
      const body = {
        course_code: $("#courseCode").value.trim(),
        course_name: $("#courseName").value.trim(),
        credits: Number($("#courseCredits").value) || 3,
        faculty_id: Number($("#courseFaculty").value),
      };
      const restore = setBusy($("#saveCourse"), "Đang lưu…");
      try {
        if (row) await api(`/api/admin/courses/${row.CourseID}`, { method: "PUT", body });
        else await api("/api/admin/courses", { method: "POST", body });
        notify("Đã lưu môn học.", "success");
        closeModal();
        await refreshAdmin("courses");
      } catch (error) {
        notify(error.message, "danger");
        restore();
      }
    });
  }

  /* -------- components ----------------------------------------------- */
  function renderAdminComponents(content, refs) {
    const rows = refs.components;
    content.innerHTML = `
      ${adminToolbar("Thành phần môn học", `${formatNumber(rows.length)} thành phần`, "Thêm thành phần", "addComponentBtn")}
      <div class="panel"><div class="table-responsive"><table class="table">
        <thead><tr><th>ID</th><th>Môn</th><th>Loại</th><th>Tên thành phần</th><th class="text-end">Thao tác</th></tr></thead>
        <tbody>${rows.map((row) => `<tr><td class="mono">${escapeHtml(row.ComponentID)}</td><td class="cell-primary">${escapeHtml(row.CourseCode)} · ${escapeHtml(row.CourseName)}</td><td>${escapeHtml(row.ComponentType)}</td><td>${escapeHtml(row.ComponentName)}</td>
          <td class="text-end text-nowrap"><button class="btn btn-light btn-sm" data-edit-component="${escapeHtml(row.ComponentID)}">Sửa</button> <button class="btn btn-light btn-sm" data-del-component="${escapeHtml(row.ComponentID)}">Xóa</button></td></tr>`).join("")}</tbody>
      </table></div></div>`;
    $("#addComponentBtn").addEventListener("click", () => openComponentModal(refs));
    content.querySelectorAll("[data-edit-component]").forEach((button) => {
      const row = rows.find((item) => Number(item.ComponentID) === Number(button.dataset.editComponent));
      button.addEventListener("click", () => openComponentModal(refs, row));
    });
    content.querySelectorAll("[data-del-component]").forEach((button) => {
      button.addEventListener("click", () => deleteAdminRow("components", button.dataset.delComponent, "thành phần"));
    });
  }

  function openComponentModal(refs, row = null) {
    const options = refs.courses.map((course) => ({ value: course.CourseID, label: `${course.CourseCode} — ${course.CourseName}` }));
    openModal({
      title: row ? "Sửa thành phần" : "Thêm thành phần",
      body: `<div class="field-grid">
        ${field({ id: "componentCourse", label: "Môn học", type: "select", value: row?.CourseID || refs.courses[0]?.CourseID, options, span: true })}
        ${field({ id: "componentType", label: "Loại", type: "select", value: row?.ComponentType || "THEORY", options: [
          { value: "THEORY", label: "Lý thuyết" }, { value: "PRACTICE", label: "Thực hành" },
        ] })}
        ${field({ id: "componentName", label: "Tên thành phần", value: row?.ComponentName || "", required: true })}
      </div>`,
      footer: modalFooter("saveComponent"),
    });
    $("#saveComponent").addEventListener("click", async () => {
      const body = {
        course_id: Number($("#componentCourse").value),
        component_type: $("#componentType").value,
        component_name: $("#componentName").value.trim(),
      };
      const restore = setBusy($("#saveComponent"), "Đang lưu…");
      try {
        if (row) await api(`/api/admin/components/${row.ComponentID}`, { method: "PUT", body });
        else await api("/api/admin/components", { method: "POST", body });
        notify("Đã lưu thành phần.", "success");
        closeModal();
        await refreshAdmin("components");
      } catch (error) {
        notify(error.message, "danger");
        restore();
      }
    });
  }

  /* -------- sections ------------------------------------------------- */
  function renderAdminSections(content, refs) {
    const rows = state.adminCache.sections || [];
    if (!state.adminCache.sections) {
      api("/api/admin/sections").then((payload) => {
        state.adminCache.sections = payload.data || [];
        renderAdminSections(content, refs);
      }).catch((error) => {
        content.innerHTML = errorState(error.message);
      });
      return;
    }
    content.innerHTML = `
      ${adminToolbar("Lớp học phần", `${formatNumber(rows.length)} lớp`, "Thêm lớp", "addSectionBtn")}
      <div class="panel"><div class="table-responsive"><table class="table">
        <thead><tr><th>ID</th><th>Mã lớp</th><th>Môn</th><th>Học kỳ</th><th>Giảng viên</th><th>Lịch</th><th>Sĩ số</th><th>Trạng thái</th><th class="text-end">Thao tác</th></tr></thead>
        <tbody>${rows.map((row) => `<tr>
          <td class="mono">${escapeHtml(row.SectionID)}</td>
          <td class="cell-primary">${escapeHtml(row.SectionCode)}</td>
          <td>${escapeHtml(row.CourseCode)} · ${escapeHtml(row.CourseName)}<div class="cell-muted">${escapeHtml(row.ComponentType)}</div></td>
          <td class="cell-muted">${escapeHtml(semesterLabel(row))}</td>
          <td>${escapeHtml(row.InstructorName || "—")}</td>
          <td class="cell-muted">${escapeHtml(dayName(row.DayOfWeek))} ${formatTime(row.StartTime)}–${formatTime(row.EndTime)}<div>${escapeHtml(row.RoomCode || "")}</div></td>
          <td class="mono">${formatNumber(row.EnrolledCount ?? row.Capacity)}</td>
          <td>${statusBadge(row.SectionStatus)}</td>
          <td class="text-end text-nowrap"><button class="btn btn-light btn-sm" data-edit-section="${escapeHtml(row.SectionID)}">Sửa</button> <button class="btn btn-light btn-sm" data-del-section="${escapeHtml(row.SectionID)}">Xóa</button></td>
        </tr>`).join("")}</tbody>
      </table></div></div>`;
    $("#addSectionBtn").addEventListener("click", () => openSectionModal(refs));
    content.querySelectorAll("[data-edit-section]").forEach((button) => {
      const row = rows.find((item) => Number(item.SectionID) === Number(button.dataset.editSection));
      button.addEventListener("click", () => openSectionModal(refs, row));
    });
    content.querySelectorAll("[data-del-section]").forEach((button) => {
      button.addEventListener("click", () => deleteAdminRow("sections", button.dataset.delSection, "lớp học phần"));
    });
  }

  function openSectionModal(refs, row = null) {
    const componentOptions = refs.components.map((component) => ({
      value: component.ComponentID,
      label: `${component.CourseCode} · ${component.ComponentType} — ${component.ComponentName}`,
    }));
    const semesterOptions = refs.semesters.map((semester) => ({ value: semester.SemesterID, label: semesterLabel(semester) }));
    const staffOptions = [{ value: "", label: "Chưa phân công" }].concat(
      refs.users.filter((user) => user.Role === "STAFF").map((user) => ({ value: user.UserID, label: user.FullName })),
    );
    openModal({
      title: row ? "Sửa lớp học phần" : "Thêm lớp học phần",
      size: "lg",
      body: `<div class="field-grid">
        ${field({ id: "sectionComponent", label: "Thành phần môn", type: "select", value: row?.ComponentID || refs.components[0]?.ComponentID, options: componentOptions, span: true })}
        ${field({ id: "sectionSemester", label: "Học kỳ", type: "select", value: row?.SemesterID || refs.semesters[0]?.SemesterID, options: semesterOptions })}
        ${field({ id: "sectionCode", label: "Mã lớp", value: row?.SectionCode || "", placeholder: "VD: CC01", required: true })}
        ${field({ id: "sectionInstructor", label: "Giảng viên", type: "select", value: row?.PrimaryInstructorID || "", options: staffOptions, span: true })}
        ${field({ id: "sectionCapacity", label: "Sĩ số tối đa", type: "number", value: row?.Capacity || 40, required: true })}
        ${field({ id: "sectionStatus", label: "Trạng thái", type: "select", value: row?.SectionStatus || "OPEN", options: [
          { value: "OPEN", label: "OPEN" }, { value: "CLOSED", label: "CLOSED" }, { value: "CANCELLED", label: "CANCELLED" },
        ] })}
        ${field({ id: "sectionDay", label: "Thứ", type: "select", value: row?.DayOfWeek || 1, options: [
          { value: 1, label: "Thứ 2" }, { value: 2, label: "Thứ 3" }, { value: 3, label: "Thứ 4" }, { value: 4, label: "Thứ 5" },
          { value: 5, label: "Thứ 6" }, { value: 6, label: "Thứ 7" }, { value: 7, label: "Chủ nhật" },
        ] })}
        ${field({ id: "sectionRoom", label: "Phòng", value: row?.RoomCode || "A101", required: true })}
        ${field({ id: "sectionStart", label: "Bắt đầu", type: "time", value: row ? String(row.StartTime).slice(0, 5) : "07:00", required: true })}
        ${field({ id: "sectionEnd", label: "Kết thúc", type: "time", value: row ? String(row.EndTime).slice(0, 5) : "09:00", required: true })}
      </div>`,
      footer: modalFooter("saveSection"),
    });
    $("#saveSection").addEventListener("click", async () => {
      const body = {
        component_id: Number($("#sectionComponent").value),
        semester_id: Number($("#sectionSemester").value),
        instructor_id: Number($("#sectionInstructor").value) || null,
        section_code: $("#sectionCode").value.trim(),
        capacity: Number($("#sectionCapacity").value) || 40,
        status: $("#sectionStatus").value,
        day_of_week: Number($("#sectionDay").value),
        start_time: $("#sectionStart").value,
        end_time: $("#sectionEnd").value,
        room_code: $("#sectionRoom").value.trim(),
      };
      const restore = setBusy($("#saveSection"), "Đang lưu…");
      try {
        if (row) await api(`/api/admin/sections/${row.SectionID}`, { method: "PUT", body });
        else await api("/api/admin/sections", { method: "POST", body });
        notify("Đã lưu lớp học phần.", "success");
        state.adminCache.sections = null;
        closeModal();
        await refreshAdmin("sections");
      } catch (error) {
        notify(error.message, "danger");
        restore();
      }
    });
  }

  /* -------- enrollments (BTL2 3.1 / 3.2) ----------------------------- */
  function enrollmentSectionLabel(section) {
    return `${semesterLabel(section)} · ${section.CourseCode} ${section.SectionCode}`;
  }

  async function renderAdminEnrollments(content, refs) {
    content.innerHTML = loadingState("Đang tải danh sách ghi danh…");
    try {
      const sections = await ensureAdminSections();
      const filters = state.enrollmentFilters || (state.enrollmentFilters = {
        student_id: "", semester_id: "", status: "", sort: "id", limit: 100,
      });
      const params = new URLSearchParams({ limit: String(filters.limit), offset: "0" });
      if (filters.student_id) params.set("student_id", filters.student_id);
      if (filters.semester_id) params.set("semester_id", filters.semester_id);
      if (filters.status) params.set("status", filters.status);
      const rows = (await api(`/api/enrollments?${params.toString()}`)).data || [];
      const sorters = {
        id: (a, b) => Number(b.EnrollmentID) - Number(a.EnrollmentID),
        name: (a, b) => String(a.StudentName).localeCompare(String(b.StudentName), "vi"),
        section: (a, b) => String(a.SectionCode).localeCompare(String(b.SectionCode), "vi"),
        status: (a, b) => String(a.EnrollmentStatus).localeCompare(String(b.EnrollmentStatus)),
      };
      const sorted = [...rows].sort(sorters[filters.sort] || sorters.id);
      const students = refs.users.filter((user) => user.Role === "STUDENT");
      content.innerHTML = `
        ${adminToolbar("Ghi danh", `${formatNumber(rows.length)} bản ghi từ sp_GetStudentEnrollments`, "Thêm ghi danh", "addEnrollmentBtn")}
        <div class="panel mb-3"><div class="panel-body tight">
          <div class="filter-grid">
            <div>
              <label class="form-label" for="enrollFilterStudent">Sinh viên</label>
              <select class="form-select" id="enrollFilterStudent">
                <option value="">Tất cả sinh viên</option>
                ${students.map((student) => `<option value="${escapeHtml(student.UserID)}" ${String(student.UserID) === String(filters.student_id) ? "selected" : ""}>${escapeHtml(student.StudentCode || "")} — ${escapeHtml(student.FullName)}</option>`).join("")}
              </select>
            </div>
            <div>
              <label class="form-label" for="enrollFilterSemester">Học kỳ</label>
              <select class="form-select" id="enrollFilterSemester">
                <option value="">Tất cả học kỳ</option>
                ${refs.semesters.map((semester) => `<option value="${escapeHtml(semester.SemesterID)}" ${String(semester.SemesterID) === String(filters.semester_id) ? "selected" : ""}>${escapeHtml(semesterLabel(semester))}</option>`).join("")}
              </select>
            </div>
            <div>
              <label class="form-label" for="enrollFilterStatus">Trạng thái</label>
              <select class="form-select" id="enrollFilterStatus">
                <option value="">Tất cả trạng thái</option>
                ${["ACTIVE", "DROPPED", "COMPLETED"].map((status) => `<option value="${status}" ${status === filters.status ? "selected" : ""}>${status}</option>`).join("")}
              </select>
            </div>
            <div>
              <label class="form-label" for="enrollSort">Sắp xếp</label>
              <select class="form-select" id="enrollSort">
                <option value="id" ${filters.sort === "id" ? "selected" : ""}>Mới nhất</option>
                <option value="name" ${filters.sort === "name" ? "selected" : ""}>Tên sinh viên</option>
                <option value="section" ${filters.sort === "section" ? "selected" : ""}>Mã lớp</option>
                <option value="status" ${filters.sort === "status" ? "selected" : ""}>Trạng thái</option>
              </select>
            </div>
          </div>
          <p class="cell-muted mt-2 mb-0">Bộ lọc gửi trực tiếp vào <code>sp_GetStudentEnrollments</code>. Thêm/sửa/xóa gọi <code>sp_InsertEnrollment</code>, <code>sp_UpdateEnrollment</code>, <code>sp_DeleteEnrollment</code>; lỗi nghiệp vụ từ procedure hiển thị trong toast.</p>
        </div></div>
        <div class="panel"><div class="table-responsive"><table class="table">
          <thead><tr><th>ID</th><th>Sinh viên</th><th>Lớp học phần</th><th>Học kỳ</th><th>Ngày ghi danh</th><th>Trạng thái</th><th class="text-end">Thao tác</th></tr></thead>
          <tbody>${sorted.length ? sorted.map((row) => `<tr>
            <td class="mono">${escapeHtml(row.EnrollmentID)}</td>
            <td class="cell-primary">${escapeHtml(row.StudentName)}<div class="cell-muted">${escapeHtml(row.StudentCode)}</div></td>
            <td>${escapeHtml(row.SectionCode)}<div class="cell-muted">${escapeHtml(row.CourseCode)} · ${escapeHtml(row.CourseName)}</div></td>
            <td class="cell-muted">${escapeHtml(semesterLabel(row))}</td>
            <td class="cell-muted">${escapeHtml(formatDate(row.EnrollmentDate))}</td>
            <td>${statusBadge(row.EnrollmentStatus)}</td>
            <td class="text-end text-nowrap">
              <button class="btn btn-light btn-sm" data-edit-enrollment="${escapeHtml(row.EnrollmentID)}">Sửa</button>
              <button class="btn btn-light btn-sm" data-del-enrollment="${escapeHtml(row.EnrollmentID)}">Xóa</button>
            </td>
          </tr>`).join("") : '<tr><td colspan="7" class="cell-muted">Không có ghi danh phù hợp.</td></tr>'}</tbody>
        </table></div></div>`;
      const bindFilter = (id, key) => {
        const element = $(`#${id}`);
        if (!element) return;
        element.addEventListener("change", () => {
          filters[key] = element.value;
          renderAdminEnrollments(content, refs);
        });
      };
      bindFilter("enrollFilterStudent", "student_id");
      bindFilter("enrollFilterSemester", "semester_id");
      bindFilter("enrollFilterStatus", "status");
      bindFilter("enrollSort", "sort");
      $("#addEnrollmentBtn").addEventListener("click", () => openEnrollmentModal(refs, sections));
      content.querySelectorAll("[data-edit-enrollment]").forEach((button) => {
        const row = rows.find((item) => Number(item.EnrollmentID) === Number(button.dataset.editEnrollment));
        button.addEventListener("click", () => openEnrollmentModal(refs, sections, row));
      });
      content.querySelectorAll("[data-del-enrollment]").forEach((button) => {
        button.addEventListener("click", () => {
          const row = rows.find((item) => Number(item.EnrollmentID) === Number(button.dataset.delEnrollment));
          confirmAction(
            `Xóa ghi danh <strong>#${escapeHtml(button.dataset.delEnrollment)}</strong>${row ? ` của ${escapeHtml(row.StudentName)}` : ""}?<br>Procedure sẽ từ chối nếu ghi danh đã có điểm.`,
            async () => {
              try {
                await api(`/api/enrollments/${button.dataset.delEnrollment}`, { method: "DELETE" });
                notify("Đã xóa ghi danh.", "success");
                await refreshAdmin("enrollments");
              } catch (error) {
                notify(error.message, "danger");
              }
            },
            { danger: true, label: "Xóa" },
          );
        });
      });
    } catch (error) {
      content.innerHTML = errorState(error.message);
    }
  }

  function openEnrollmentModal(refs, sections, row = null) {
    const students = refs.users.filter((user) => user.Role === "STUDENT");
    const studentOptions = students.map((student) => ({
      value: student.UserID,
      label: `${student.StudentCode || ""} — ${student.FullName}`,
    }));
    const sectionOptions = sections.map((section) => ({
      value: section.SectionID,
      label: enrollmentSectionLabel(section),
    }));
    const statusOptions = ["ACTIVE", "DROPPED", "COMPLETED"].map((status) => ({ value: status, label: status }));
    openModal({
      title: row ? `Sửa ghi danh #${row.EnrollmentID}` : "Thêm ghi danh",
      size: "lg",
      body: `${row ? `<p class="cell-muted">Sinh viên: <strong>${escapeHtml(row.StudentName)}</strong> · ${escapeHtml(row.StudentCode)}</p>` : ""}
        <div class="field-grid">
          ${row ? "" : field({ id: "enrollStudent", label: "Sinh viên", type: "select", value: studentOptions[0]?.value, options: studentOptions, span: true })}
          ${field({ id: "enrollSection", label: "Lớp học phần", type: "select", value: row?.SectionID || sectionOptions[0]?.value, options: sectionOptions, span: true })}
          ${field({ id: "enrollStatus", label: "Trạng thái", type: "select", value: row?.EnrollmentStatus || "ACTIVE", options: statusOptions })}
        </div>`,
      footer: modalFooter("saveEnrollment"),
    });
    $("#saveEnrollment").addEventListener("click", async () => {
      const body = {
        section_id: Number($("#enrollSection").value),
        status: $("#enrollStatus").value,
      };
      if (!row) {
        body.student_id = Number($("#enrollStudent").value);
        if (!body.student_id) {
          notify("Chọn sinh viên cần ghi danh.", "warning");
          return;
        }
      }
      if (!body.section_id) {
        notify("Chọn lớp học phần.", "warning");
        return;
      }
      const restore = setBusy($("#saveEnrollment"), "Đang lưu…");
      try {
        if (row) await api(`/api/enrollments/${row.EnrollmentID}`, { method: "PUT", body });
        else await api("/api/enrollments", { method: "POST", body });
        notify(row ? "Đã cập nhật ghi danh." : "Đã thêm ghi danh.", "success");
        closeModal();
        await refreshAdmin("enrollments");
      } catch (error) {
        notify(error.message, "danger");
        restore();
      }
    });
  }

  /* -------- statistics (BTL2 3.3) ------------------------------------ */
  async function renderAdminStatistics(content, refs) {
    content.innerHTML = loadingState("Đang tính thống kê…");
    try {
      const sections = await ensureAdminSections();
      const filters = state.statisticsFilters || (state.statisticsFilters = {
        section_id: "", semester_id: "", min_submissions: 0,
      });
      const params = new URLSearchParams({ min_submissions: String(filters.min_submissions) });
      if (filters.section_id) params.set("section_id", filters.section_id);
      if (filters.semester_id) params.set("semester_id", filters.semester_id);
      const rows = (await api(`/api/statistics/assignments?${params.toString()}`)).data || [];
      const enrollments = (await api("/api/enrollments?limit=200")).data || [];
      content.innerHTML = `
        ${adminToolbar("Thống kê bài tập", `${formatNumber(rows.length)} bài tập từ sp_GetAssignmentStatistics`, null, null)}
        <div class="panel mb-3"><div class="panel-body tight">
          <div class="filter-grid">
            <div>
              <label class="form-label" for="statFilterSection">Lớp học phần</label>
              <select class="form-select" id="statFilterSection">
                <option value="">Tất cả lớp</option>
                ${sections.map((section) => `<option value="${escapeHtml(section.SectionID)}" ${String(section.SectionID) === String(filters.section_id) ? "selected" : ""}>${escapeHtml(enrollmentSectionLabel(section))}</option>`).join("")}
              </select>
            </div>
            <div>
              <label class="form-label" for="statFilterSemester">Học kỳ</label>
              <select class="form-select" id="statFilterSemester">
                <option value="">Tất cả học kỳ</option>
                ${refs.semesters.map((semester) => `<option value="${escapeHtml(semester.SemesterID)}" ${String(semester.SemesterID) === String(filters.semester_id) ? "selected" : ""}>${escapeHtml(semesterLabel(semester))}</option>`).join("")}
              </select>
            </div>
            <div>
              <label class="form-label" for="statMinSubmissions">Số bài nộp tối thiểu (HAVING)</label>
              <input class="form-control" id="statMinSubmissions" type="number" min="0" value="${escapeHtml(filters.min_submissions)}">
            </div>
          </div>
          <p class="cell-muted mt-2 mb-0">Bộ lọc WHERE/HAVING được truyền vào <code>sp_GetAssignmentStatistics</code>. Nút “Kiểm tra hàm” gọi <code>fn_CalculateAssignmentCompletionRate</code> cho từng bài tập.</p>
        </div></div>
        <div class="panel"><div class="table-responsive"><table class="table">
          <thead><tr><th>Bài tập</th><th>Lớp</th><th>Môn</th><th>HK</th><th>Đủ ĐK</th><th>Đã nộp</th><th>Thiếu</th><th>Tỷ lệ</th><th>Hàm</th><th>Nộp cuối</th></tr></thead>
          <tbody>${rows.length ? rows.map((row) => `<tr>
            <td class="cell-primary">${escapeHtml(row.AssignmentTitle)}<div class="cell-muted">#${escapeHtml(row.AssignmentID)}</div></td>
            <td>${escapeHtml(row.SectionCode)}</td>
            <td>${escapeHtml(row.CourseCode)} · ${escapeHtml(row.CourseName)}</td>
            <td class="cell-muted">${escapeHtml(`${row.AcademicYear} · HK${row.TermNo}`)}</td>
            <td class="mono">${formatNumber(row.EligibleStudentCount)}</td>
            <td class="mono">${formatNumber(row.SubmittedStudentCount)}</td>
            <td class="mono">${formatNumber(row.MissingStudentCount)}</td>
            <td class="mono">${formatNumber(row.CompletionRate)}%</td>
            <td><button class="btn btn-light btn-sm" data-check-completion="${escapeHtml(row.AssignmentID)}">Kiểm tra hàm</button> <span class="cell-muted" id="completion-${escapeHtml(row.AssignmentID)}"></span></td>
            <td class="cell-muted">${escapeHtml(formatDate(row.LastSubmittedAt))}</td>
          </tr>`).join("") : '<tr><td colspan="10" class="cell-muted">Không có bài tập phù hợp bộ lọc.</td></tr>'}</tbody>
        </table></div></div>
        <div class="panel mt-3"><div class="panel-body">
          <div class="toolbar"><div><strong>fn_CalculateStudentAverageScore</strong> <span class="cell-muted">tính điểm trung bình từ Grade đã công bố</span></div></div>
          <div class="filter-grid">
            <div>
              <label class="form-label" for="averageEnrollment">Ghi danh</label>
              <select class="form-select" id="averageEnrollment">${enrollments.map((row) => `<option value="${escapeHtml(row.EnrollmentID)}">${escapeHtml(row.StudentCode)} — ${escapeHtml(row.StudentName)} · ${escapeHtml(row.SectionCode)}</option>`).join("")}</select>
            </div>
            <div class="d-flex align-items-end">
              <button class="btn btn-pink" id="checkAverageBtn">Tính điểm trung bình</button>
            </div>
          </div>
          <p class="mt-2 mb-0">Kết quả: <strong id="averageResult">—</strong></p>
        </div></div>`;
      const bindFilter = (id, key, numeric = false) => {
        const element = $(`#${id}`);
        if (!element) return;
        const eventName = element.tagName === "INPUT" ? "change" : "change";
        element.addEventListener(eventName, () => {
          filters[key] = numeric ? Number(element.value) || 0 : element.value;
          renderAdminStatistics(content, refs);
        });
      };
      bindFilter("statFilterSection", "section_id");
      bindFilter("statFilterSemester", "semester_id");
      bindFilter("statMinSubmissions", "min_submissions", true);
      content.querySelectorAll("[data-check-completion]").forEach((button) => {
        button.addEventListener("click", async () => {
          const target = $(`#completion-${button.dataset.checkCompletion}`);
          const restore = setBusy(button, "…");
          try {
            const payload = await api(`/api/statistics/assignments/${button.dataset.checkCompletion}/completion`);
            const rate = Number(payload.data.completion_rate || 0);
            if (target) target.textContent = `${formatNumber(rate)}%`;
            notify(`fn_CalculateAssignmentCompletionRate = ${formatNumber(rate)}%`, "success");
          } catch (error) {
            notify(error.message, "danger");
          } finally {
            restore();
          }
        });
      });
      const averageButton = $("#checkAverageBtn");
      if (averageButton) {
        averageButton.addEventListener("click", async () => {
          const enrollmentId = Number($("#averageEnrollment").value);
          if (!enrollmentId) {
            notify("Chọn ghi danh cần tính điểm.", "warning");
            return;
          }
          const restore = setBusy(averageButton, "Đang tính…");
          try {
            const payload = await api(`/api/statistics/enrollments/${enrollmentId}/average`);
            const average = Number(payload.data.average_score || 0);
            $("#averageResult").textContent = `${formatNumber(average)}%`;
            notify(`fn_CalculateStudentAverageScore = ${formatNumber(average)}%`, "success");
          } catch (error) {
            notify(error.message, "danger");
          } finally {
            restore();
          }
        });
      }
    } catch (error) {
      content.innerHTML = errorState(error.message);
    }
  }

  /* -------- data explorer -------------------------------------------- */
  async function renderAdminData(content) {
    content.innerHTML = loadingState("Đang tải danh sách bảng…");
    try {
      const tables = (await api("/api/admin/data/tables")).data || [];
      content.innerHTML = `
        <div class="toolbar"><div><strong>Khám phá dữ liệu</strong> <span class="cell-muted">${formatNumber(tables.length)} bảng BTL1</span></div></div>
        <div class="panel mb-3"><div class="panel-body tight">
          <label class="form-label" for="exploreTable">Chọn bảng</label>
          <select class="form-select" id="exploreTable">${tables.map((table) => `<option value="${escapeHtml(table)}">${escapeHtml(table)}</option>`).join("")}</select>
        </div></div>
        <div id="exploreResult"></div>`;
      const load = async () => {
        const table = $("#exploreTable").value;
        const target = $("#exploreResult");
        target.innerHTML = loadingState();
        try {
          const rows = (await api(`/api/admin/data/${table}?limit=100`)).data || [];
          target.innerHTML = genericTable(Object.keys(rows[0] || {}), rows);
        } catch (error) {
          target.innerHTML = errorState(error.message);
        }
      };
      $("#exploreTable").addEventListener("change", load);
      await load();
    } catch (error) {
      content.innerHTML = errorState(error.message);
    }
  }

  function genericTable(columns, rows) {
    if (!columns.length) return emptyState("Bảng không có dữ liệu", "Bảng này hiện chưa có bản ghi nào.");
    const head = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("");
    const body = rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column] ?? "")}</td>`).join("")}</tr>`).join("");
    return `<div class="panel"><div class="table-responsive"><table class="table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></div>`;
  }

  function deleteAdminRow(resource, id, label) {
    confirmAction(`Xóa ${escapeHtml(label)} này? Thao tác có thể bị từ chối nếu đang được tham chiếu bởi dữ liệu khác.`, async () => {
      try {
        await api(`/api/admin/${resource}/${id}`, { method: "DELETE" });
        notify(`Đã xóa ${label}.`, "success");
        state.adminCache.sections = null;
        await refreshAdmin(state.adminTab);
      } catch (error) {
        notify(error.message, "danger");
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Bootstrap                                                           */
  /* ------------------------------------------------------------------ */
  async function init() {
    hydrateIcons(document);
    bindLogin();
    bindAccountMenu();
    window.addEventListener("hashchange", () => {
      if (state.role) render();
    });
    const loggedIn = await checkAuth();
    if (!loggedIn) return;
    await render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
