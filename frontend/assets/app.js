(() => {
  "use strict";

  const state = {
    students: [],
    semesters: [],
    sections: [],
    courses: [],
    enrollments: [],
    statistics: [],
    defaultSemesterId: null,
    deleteTarget: null,
    sectionMap: new Map(),
    studentMap: new Map(),
    user: null,
    role: null,
    selectedRole: null,
  };

  const ROLE_LABELS = { STUDENT: "Sinh viên", STAFF: "Cán bộ", ADMIN: "Quản trị viên" };

  const $ = (selector) => document.querySelector(selector);

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

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString("vi-VN") : "—";
  }

  function formatPercent(value) {
    const number = Number(value);
    return Number.isFinite(number) ? `${number.toLocaleString("vi-VN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}%` : "—";
  }

  function formatDate(value) {
    if (!value) return "—";
    const text = String(value).replace("T", " ");
    const [datePart, timePart] = text.split(" ");
    const pieces = datePart.split("-");
    if (pieces.length !== 3) return escapeHtml(text);
    const date = `${pieces[2]}/${pieces[1]}/${pieces[0]}`;
    return timePart ? `${date} ${timePart.slice(0, 5)}` : date;
  }

  function formatTime(value) {
    if (!value) return "—";
    return String(value).slice(0, 5);
  }

  function dayName(dayOfWeek) {
    const names = ["", "", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
    return names[Number(dayOfWeek)] || `Ngày ${escapeHtml(dayOfWeek)}`;
  }

  function semesterLabel(semester) {
    return `${semester.AcademicYear} · HK${semester.TermNo}`;
  }

  function statusBadge(status) {
    const value = String(status || "").toUpperCase();
    const css = ["ACTIVE", "DROPPED", "COMPLETED", "OPEN", "CLOSED", "CANCELLED"].includes(value)
      ? value.toLowerCase()
      : "neutral";
    return `<span class="badge-soft ${css}">${escapeHtml(value || "—")}</span>`;
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
    const toast = new bootstrap.Toast(wrapper, { delay: 4500 });
    wrapper.addEventListener("hidden.bs.toast", () => wrapper.remove());
    toast.show();
  }

  function setBusy(button, text) {
    if (!button) return () => {};
    const original = button.innerHTML;
    button.disabled = true;
    button.textContent = text;
    return () => {
      button.disabled = false;
      button.innerHTML = original;
    };
  }

  function setOptions(select, items, valueKey, label, placeholder) {
    if (!select) return;
    const previous = select.value;
    const options = [`<option value="">${escapeHtml(placeholder)}</option>`];
    for (const item of items) {
      options.push(`<option value="${escapeHtml(item[valueKey])}">${escapeHtml(label(item))}</option>`);
    }
    select.innerHTML = options.join("");
    if (previous && [...select.options].some((option) => option.value === previous)) {
      select.value = previous;
    }
  }

  function sectionLabel(section) {
    return `${section.SectionCode} · ${section.AcademicYear} HK${section.TermNo} · ${section.CourseCode}`;
  }

  function populateFilters() {
    setOptions(
      $("#filterStudent"),
      state.students,
      "StudentID",
      (student) => `${student.StudentCode} — ${student.FullName}`,
      "Tất cả sinh viên",
    );
    setOptions(
      $("#filterSemester"),
      state.semesters,
      "SemesterID",
      semesterLabel,
      "Tất cả học kỳ",
    );
    setOptions(
      $("#statsSemester"),
      state.semesters,
      "SemesterID",
      semesterLabel,
      "Tất cả học kỳ",
    );
    setOptions(
      $("#formStudent"),
      state.students,
      "StudentID",
      (student) => `${student.StudentCode} — ${student.FullName}`,
      "Chọn sinh viên",
    );

    if (state.defaultSemesterId) {
      $("#filterSemester").value = String(state.defaultSemesterId);
      $("#statsSemester").value = String(state.defaultSemesterId);
    }
    populateStatsSections();
    populateFormSections();
  }

  function populateStatsSections() {
    const semesterId = Number($("#statsSemester").value) || null;
    const sections = semesterId
      ? state.sections.filter((section) => Number(section.SemesterID) === semesterId)
      : state.sections;
    setOptions($("#statsSection"), sections, "SectionID", sectionLabel, "Tất cả lớp");
  }

  function populateFormSections() {
    setOptions($("#formSection"), state.sections, "SectionID", sectionLabel, "Chọn lớp học phần");
  }

  async function loadCatalog() {
    const results = await Promise.allSettled([
      api("/api/semesters"),
      api("/api/students"),
      api("/api/sections"),
      api("/api/courses"),
    ]);
    const [semesters, students, sections, courses] = results;

    if (semesters.status === "fulfilled") state.semesters = semesters.value.data || [];
    if (students.status === "fulfilled") state.students = students.value.data || [];
    if (sections.status === "fulfilled") state.sections = sections.value.data || [];
    if (courses.status === "fulfilled") state.courses = courses.value.data || [];

    state.sectionMap = new Map(state.sections.map((section) => [Number(section.SectionID), section]));
    state.studentMap = new Map(state.students.map((student) => [Number(student.StudentID), student]));
    const demo = state.semesters.find(
      (semester) => semester.AcademicYear === "2026-2027" && Number(semester.TermNo) === 1,
    );
    state.defaultSemesterId = demo?.SemesterID || state.semesters[0]?.SemesterID || null;
    populateFilters();

    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length) {
      notify(failed[0].reason?.message || "Không tải được danh mục.", "danger");
    }
  }

  async function loadHealth(showToast = false) {
    try {
      const payload = await api("/api/health");
      const info = payload.database || {};
      $("#healthBadgeText").textContent = "API & DB ổn định";
      $("#healthDot").className = "status-dot ok";
      $("#healthPanelDot").className = "status-dot ok";
      $("#healthPanelText").textContent = "Đang hoạt động";
      $("#healthVersion").textContent = info.version || "—";
      $("#healthDatabase").textContent = info.database_name || "—";
      $("#healthServerTime").textContent = formatDate(info.server_time);
      $("#healthCheckedAt").textContent = new Date().toLocaleTimeString("vi-VN");
    } catch (error) {
      $("#healthBadgeText").textContent = "Mất kết nối";
      $("#healthDot").className = "status-dot bad";
      $("#healthPanelDot").className = "status-dot bad";
      $("#healthPanelText").textContent = "Không kết nối được";
      $("#healthVersion").textContent = "—";
      $("#healthDatabase").textContent = "—";
      $("#healthServerTime").textContent = "—";
      $("#healthCheckedAt").textContent = new Date().toLocaleTimeString("vi-VN");
      if (showToast) notify(error.message, "danger");
    }
  }

  async function loadDashboard() {
    try {
      const payload = await api("/api/statistics/overview");
      const data = payload.data || {};
      $("#statStudents").textContent = formatNumber(data.student_count);
      $("#statSections").textContent = formatNumber(data.section_count);
      $("#statEnrollments").textContent = formatNumber(data.enrollment_count);
      $("#statActiveEnrollments").textContent = formatNumber(data.active_enrollment_count);
      $("#statAssignments").textContent = formatNumber(data.assignment_count);
      $("#statSubmissions").textContent = formatNumber(data.submission_count);
      $("#statPublishedGrades").textContent = formatNumber(data.published_grade_count);
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  async function loadEnrollments() {
    const params = new URLSearchParams();
    if ($("#filterStudent").value) params.set("student_id", $("#filterStudent").value);
    if ($("#filterSemester").value) params.set("semester_id", $("#filterSemester").value);
    if ($("#filterStatus").value) params.set("status", $("#filterStatus").value);
    params.set("limit", $("#filterLimit").value || "50");
    params.set("offset", "0");

    const restore = setBusy($("#refreshEnrollmentsBtn"), "Đang tải…");
    try {
      const payload = await api(`/api/enrollments?${params.toString()}`);
      state.enrollments = payload.data || [];
      renderEnrollments();
    } catch (error) {
      state.enrollments = [];
      renderEnrollments();
      notify(error.message, "danger");
    } finally {
      restore();
    }
  }

  function renderEnrollments() {
    const rows = state.enrollments;
    const tbody = $("#enrollmentTableBody");
    const tableWrap = $("#enrollmentTableWrap");
    const empty = $("#enrollmentEmpty");
    $("#enrollmentCount").textContent = `${formatNumber(rows.length)} ghi danh`;

    if (!rows.length) {
      tbody.innerHTML = "";
      tableWrap.classList.add("d-none");
      empty.classList.remove("d-none");
      return;
    }
    tableWrap.classList.remove("d-none");
    empty.classList.add("d-none");
    tbody.innerHTML = rows.map((row) => {
      const schedule = `${dayName(row.DayOfWeek)} · ${formatTime(row.StartTime)}–${formatTime(row.EndTime)}`;
      return `
        <tr>
          <td>
            <div class="cell-primary">${escapeHtml(row.StudentName)}</div>
            <div class="cell-muted">${escapeHtml(row.StudentCode)} · ID ${escapeHtml(row.StudentID)}</div>
          </td>
          <td>
            <div class="cell-primary">${escapeHtml(row.SectionCode)}</div>
            <div class="cell-muted">${escapeHtml(row.CourseCode)} · ${escapeHtml(row.CourseName)}</div>
            <div class="cell-muted">${escapeHtml(row.ComponentType)} · phòng ${escapeHtml(row.RoomCode)}</div>
          </td>
          <td>
            <div>${escapeHtml(row.AcademicYear)} · HK${escapeHtml(row.TermNo)}</div>
            <div class="cell-muted">Semester ${escapeHtml(row.SemesterID)}</div>
          </td>
          <td>
            <div>${escapeHtml(schedule)}</div>
            <div class="cell-muted">Sĩ số tối đa ${escapeHtml(row.Capacity)}</div>
          </td>
          <td>${formatDate(row.EnrollmentDate)}</td>
          <td>${statusBadge(row.EnrollmentStatus)}</td>
          <td class="text-end text-nowrap">
            <button class="btn btn-sm btn-outline-primary me-1" type="button" data-action="edit" data-id="${escapeHtml(row.EnrollmentID)}" aria-label="Sửa ghi danh ${escapeHtml(row.EnrollmentID)}">Sửa</button>
            <button class="btn btn-sm btn-outline-danger" type="button" data-action="delete" data-id="${escapeHtml(row.EnrollmentID)}" aria-label="Xóa ghi danh ${escapeHtml(row.EnrollmentID)}">Xóa</button>
          </td>
        </tr>`;
    }).join("");
  }

  async function loadStatistics() {
    const params = new URLSearchParams();
    if ($("#statsSemester").value) params.set("semester_id", $("#statsSemester").value);
    if ($("#statsSection").value) params.set("section_id", $("#statsSection").value);
    const minimum = $("#statsMinSubmissions").value.trim();
    if (minimum !== "") params.set("min_submissions", minimum);

    const restore = setBusy($("#refreshStatsBtn"), "Đang tải…");
    try {
      const payload = await api(`/api/statistics/assignments?${params.toString()}`);
      state.statistics = payload.data || [];
      renderStatistics();
    } catch (error) {
      state.statistics = [];
      renderStatistics();
      notify(error.message, "danger");
    } finally {
      restore();
    }
  }

  function renderStatistics() {
    const rows = state.statistics;
    const tbody = $("#statisticsTableBody");
    const table = $("#statisticsTable");
    const empty = $("#statisticsEmpty");
    $("#statsCount").textContent = `${formatNumber(rows.length)} bài tập`;

    if (!rows.length) {
      tbody.innerHTML = "";
      table.classList.add("d-none");
      empty.classList.remove("d-none");
      return;
    }
    table.classList.remove("d-none");
    empty.classList.add("d-none");
    tbody.innerHTML = rows.map((row) => {
      const percent = Math.max(0, Math.min(100, Number(row.CompletionRate) || 0));
      return `
        <tr>
          <td>
            <div class="cell-primary">${escapeHtml(row.AssignmentTitle)}</div>
            <div class="cell-muted">Assignment ID ${escapeHtml(row.AssignmentID)}</div>
          </td>
          <td>
            <div>${escapeHtml(row.CourseCode)} · ${escapeHtml(row.CourseName)}</div>
            <div class="cell-muted">${escapeHtml(row.SectionCode)} · ${escapeHtml(row.AcademicYear)} HK${escapeHtml(row.TermNo)}</div>
          </td>
          <td class="text-end">${formatNumber(row.EligibleStudentCount)}</td>
          <td class="text-end">${formatNumber(row.SubmittedStudentCount)}</td>
          <td class="text-end">${formatNumber(row.MissingStudentCount)}</td>
          <td>
            <div class="d-flex align-items-center justify-content-between gap-2 mb-1">
              <span class="mono" id="row-completion-${escapeHtml(row.AssignmentID)}">${formatPercent(percent)}</span>
              <span class="cell-muted">${formatNumber(row.SubmissionCount)} lượt</span>
            </div>
            <div class="progress-thin" aria-hidden="true"><span id="row-progress-${escapeHtml(row.AssignmentID)}" style="width:${percent}%"></span></div>
          </td>
          <td>${formatDate(row.LastSubmittedAt)}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary" type="button" data-action="completion" data-id="${escapeHtml(row.AssignmentID)}">Gọi hàm</button>
          </td>
        </tr>`;
    }).join("");
  }

  function openCreateModal() {
    $("#enrollmentForm").reset();
    $("#enrollmentForm").classList.remove("was-validated");
    $("#enrollmentMode").value = "create";
    $("#editingEnrollmentId").value = "";
    $("#enrollmentModalTitle").textContent = "Thêm ghi danh";
    $("#enrollmentModalSubtitle").textContent = "Procedure sẽ kiểm tra tài khoản, sĩ số và trùng lặp.";
    $("#formStudent").disabled = false;
    $("#formStatus").value = "ACTIVE";
    $("#editStudentHint").classList.add("d-none");
    populateFormSections();
    bootstrap.Modal.getOrCreateInstance($("#enrollmentModal")).show();
  }

  function openEditModal(row) {
    $("#enrollmentForm").classList.remove("was-validated");
    $("#enrollmentMode").value = "edit";
    $("#editingEnrollmentId").value = String(row.EnrollmentID);
    $("#enrollmentModalTitle").textContent = `Cập nhật ghi danh #${row.EnrollmentID}`;
    $("#enrollmentModalSubtitle").textContent = "Sinh viên được giữ nguyên; có thể đổi lớp hoặc trạng thái.";
    $("#formStudent").disabled = true;
    $("#formStudent").value = String(row.StudentID);
    $("#formSection").value = String(row.SectionID);
    $("#formStatus").value = row.EnrollmentStatus;
    $("#editStudentHint").classList.remove("d-none");
    bootstrap.Modal.getOrCreateInstance($("#enrollmentModal")).show();
  }

  async function saveEnrollment(event) {
    event.preventDefault();
    const form = $("#enrollmentForm");
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }
    const mode = $("#enrollmentMode").value;
    const enrollmentId = $("#editingEnrollmentId").value;
    const payload = {
      section_id: Number($("#formSection").value),
      status: $("#formStatus").value,
    };
    if (mode === "create") payload.student_id = Number($("#formStudent").value);

    const restore = setBusy($("#saveEnrollmentBtn"), "Đang lưu…");
    try {
      const result = mode === "create"
        ? await api("/api/enrollments", { method: "POST", body: payload })
        : await api(`/api/enrollments/${enrollmentId}`, { method: "PUT", body: payload });
      bootstrap.Modal.getOrCreateInstance($("#enrollmentModal")).hide();
      notify(result?.data?.message || "Đã lưu ghi danh.", "success");
      await Promise.all([loadEnrollments(), loadStatistics(), loadDashboard()]);
    } catch (error) {
      notify(error.message, "danger");
    } finally {
      restore();
    }
  }

  function openDeleteModal(row) {
    state.deleteTarget = row;
    $("#deleteTargetText").textContent = `Xóa ghi danh #${row.EnrollmentID} của ${row.StudentName} trong lớp ${row.SectionCode}?`;
    bootstrap.Modal.getOrCreateInstance($("#deleteModal")).show();
  }

  async function confirmDelete() {
    const target = state.deleteTarget;
    if (!target) return;
    const restore = setBusy($("#confirmDeleteBtn"), "Đang xóa…");
    try {
      const result = await api(`/api/enrollments/${target.EnrollmentID}`, { method: "DELETE" });
      bootstrap.Modal.getOrCreateInstance($("#deleteModal")).hide();
      state.deleteTarget = null;
      notify(result?.data?.message || "Đã xóa ghi danh.", "success");
      await Promise.all([loadEnrollments(), loadStatistics(), loadDashboard()]);
    } catch (error) {
      notify(error.message, "danger");
    } finally {
      restore();
    }
  }

  async function runCompletion(assignmentId, target, progress) {
    if (!Number.isInteger(Number(assignmentId)) || Number(assignmentId) <= 0) {
      notify("Assignment ID phải là số nguyên dương.", "warning");
      return;
    }
    try {
      const payload = await api(`/api/statistics/assignments/${assignmentId}/completion`);
      const value = Number(payload?.data?.completion_rate) || 0;
      const safe = Math.max(0, Math.min(100, value));
      if (target) target.textContent = formatPercent(safe);
      if (progress) progress.style.width = `${safe}%`;
      notify(`Assignment ${assignmentId}: ${formatPercent(safe)} hoàn thành.`, "info");
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  async function runAverage() {
    const enrollmentId = $("#calcEnrollmentId").value.trim();
    if (!Number.isInteger(Number(enrollmentId)) || Number(enrollmentId) <= 0) {
      notify("Enrollment ID phải là số nguyên dương.", "warning");
      return;
    }
    const restore = setBusy($("#calcAverageBtn"), "Đang tính…");
    try {
      const payload = await api(`/api/statistics/enrollments/${enrollmentId}/average`);
      const value = Number(payload?.data?.average_score) || 0;
      $("#averageResult").textContent = formatPercent(value);
      notify(`Enrollment ${enrollmentId}: ${formatPercent(value)}.`, "info");
    } catch (error) {
      $("#averageResult").textContent = "—";
      notify(error.message, "danger");
    } finally {
      restore();
    }
  }

  async function runToolCompletion() {
    const assignmentId = $("#calcAssignmentId").value.trim();
    const restore = setBusy($("#calcCompletionBtn"), "Đang tính…");
    try {
      await runCompletion(assignmentId, $("#completionResult"), $("#completionProgress"));
    } finally {
      restore();
    }
  }

  function attachTableActions() {
    $("#enrollmentTableBody").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const id = Number(button.dataset.id);
      const row = state.enrollments.find((item) => Number(item.EnrollmentID) === id);
      if (!row) return;
      if (button.dataset.action === "edit") openEditModal(row);
      if (button.dataset.action === "delete") openDeleteModal(row);
    });

    $("#statisticsTableBody").addEventListener("click", async (event) => {
      const button = event.target.closest('button[data-action="completion"]');
      if (!button) return;
      const id = button.dataset.id;
      const restore = setBusy(button, "…");
      try {
        await runCompletion(id, $(`#row-completion-${id}`), $(`#row-progress-${id}`));
      } finally {
        restore();
      }
    });
  }

  function attachNavigation() {
    const body = document.body;
    const menuButton = $("#mobileMenuBtn");
    const closeSidebar = () => {
      body.classList.remove("sidebar-open");
      menuButton.setAttribute("aria-expanded", "false");
    };
    menuButton.addEventListener("click", () => {
      const open = body.classList.toggle("sidebar-open");
      menuButton.setAttribute("aria-expanded", String(open));
    });
    $("#sidebarBackdrop").addEventListener("click", closeSidebar);
    document.querySelectorAll(".sidebar .nav-link[href^='#']").forEach((link) => {
      link.addEventListener("click", () => {
        closeSidebar();
        setActiveNav(link.dataset.nav);
      });
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveNav(visible.target.id);
      }, { rootMargin: "-35% 0px -55% 0px", threshold: [0.05, 0.25, 0.5] });
      document.querySelectorAll(".section-block").forEach((section) => observer.observe(section));
    }
  }

  function setActiveNav(id) {
    document.querySelectorAll(".sidebar .nav-link[data-nav]").forEach((link) => {
      link.classList.toggle("active", link.dataset.nav === id);
    });
  }

  function attachEvents() {
    $("#enrollmentFilters").addEventListener("submit", (event) => {
      event.preventDefault();
      loadEnrollments();
    });
    $("#resetEnrollmentFilters").addEventListener("click", () => {
      $("#filterStudent").value = "";
      $("#filterSemester").value = state.defaultSemesterId ? String(state.defaultSemesterId) : "";
      $("#filterStatus").value = "";
      $("#filterLimit").value = "50";
      loadEnrollments();
    });
    $("#statisticsFilters").addEventListener("submit", (event) => {
      event.preventDefault();
      loadStatistics();
    });
    $("#resetStatsFilters").addEventListener("click", () => {
      $("#statsSemester").value = state.defaultSemesterId ? String(state.defaultSemesterId) : "";
      populateStatsSections();
      $("#statsSection").value = "";
      $("#statsMinSubmissions").value = "0";
      loadStatistics();
    });
    $("#statsSemester").addEventListener("change", () => {
      populateStatsSections();
      $("#statsSection").value = "";
    });
    $("#openCreateBtn").addEventListener("click", openCreateModal);
    $("#enrollmentForm").addEventListener("submit", saveEnrollment);
    $("#confirmDeleteBtn").addEventListener("click", confirmDelete);
    $("#refreshEnrollmentsBtn").addEventListener("click", loadEnrollments);
    $("#refreshStatsBtn").addEventListener("click", loadStatistics);
    $("#refreshDashboardBtn").addEventListener("click", () => {
      loadDashboard();
      loadHealth(true);
    });
    $("#refreshHealthBtn").addEventListener("click", () => loadHealth(true));
    $("#calcCompletionBtn").addEventListener("click", runToolCompletion);
    $("#calcAverageBtn").addEventListener("click", runAverage);
    $("#loginSubmitBtn").addEventListener("click", submitLogin);
    $("#logoutBtn").addEventListener("click", logout);
    attachTableActions();
    attachNavigation();
  }

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
      loginScreen.classList.add("d-none");
      appShell.style.display = "";
      $("#userName").textContent = state.user?.FullName || "—";
      $("#userRoleBadge").textContent = ROLE_LABELS[state.role] || state.role;
      applyRoleNavigation();
      return true;
    }
    appShell.style.display = "none";
    loginScreen.classList.remove("d-none");
    loadLoginRoles();
    return false;
  }

  async function loadLoginRoles() {
    const cards = document.querySelectorAll("#loginRoleGrid .login-role-card");
    cards.forEach((card) => {
      card.addEventListener("click", () => selectLoginRole(card.dataset.role));
    });
  }

  async function selectLoginRole(role) {
    state.selectedRole = role;
    document.querySelectorAll("#loginRoleGrid .login-role-card").forEach((card) => {
      const active = card.dataset.role === role;
      card.classList.toggle("selected", active);
      card.setAttribute("aria-checked", String(active));
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
        options.push(
          `<option value="${escapeHtml(account.UserID)}" ${inactive ? "disabled" : ""}>${escapeHtml(account.FullName)} — ${escapeHtml(account.Email)}${escapeHtml(suffix)}</option>`,
        );
      }
      select.innerHTML = options.join("");
      select.classList.remove("d-none");
      select.disabled = false;
      empty.classList.add("d-none");
      select.addEventListener("change", () => {
        submit.disabled = !select.value;
      });
    } catch (error) {
      empty.textContent = error.message || "Không tải được tài khoản.";
    }
  }

  async function submitLogin() {
    const role = state.selectedRole;
    const user_id = Number($("#loginAccountSelect").value);
    if (!role || !user_id) return;
    const restore = setBusy($("#loginSubmitBtn"), "Đang đăng nhập…");
    try {
      await api("/api/auth/login", { method: "POST", body: { role, user_id } });
      await enterApp();
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
      // ignore logout network errors
    }
    location.reload();
  }

  async function enterApp() {
    await checkAuth();
    if (!state.role) return;
    await loadCatalog();
    await Promise.allSettled([
      loadDashboard(),
      loadHealth(),
      loadEnrollments(),
      loadStatistics(),
    ]);
  }

  function applyRoleNavigation() {
    const role = state.role;
    const navItems = {
      STUDENT: [
        { id: "dashboard", glyph: "◫", label: "Tổng quan" },
        { id: "courses", glyph: "▤", label: "Khóa học của tôi" },
      ],
      STAFF: [
        { id: "dashboard", glyph: "◫", label: "Tổng quan" },
        { id: "sections", glyph: "▤", label: "Lớp tôi dạy" },
      ],
      ADMIN: [
        { id: "dashboard", glyph: "◫", label: "Tổng quan" },
        { id: "admin", glyph: "⚙", label: "Quản trị" },
        { id: "enrollments", glyph: "↔", label: "Ghi danh" },
        { id: "statistics", glyph: "▤", label: "Thống kê bài tập" },
        { id: "tools", glyph: "ƒ", label: "Hàm & quy trình" },
        { id: "about", glyph: "ⓘ", label: "Kiến trúc" },
      ],
    }[role] || [];

    const nav = $("#sidebarNav");
    nav.innerHTML = navItems
      .map(
        (item, i) => `<a class="nav-link ${i === 0 ? "active" : ""}" href="#${item.id}" data-nav="${item.id}">
          <span class="nav-glyph" aria-hidden="true">${item.glyph}</span> ${item.label}</a>`,
      )
      .join("");

    // Show/hide legacy sections based on role.
    const legacyIds = ["enrollments", "statistics", "tools", "about"];
    legacyIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = role === "ADMIN" ? "" : "none";
    });
    const ws = $("#roleWorkspace");
    ws.style.display = role === "ADMIN" ? "none" : "";

    document.querySelectorAll("#sidebarNav .nav-link[href^='#']").forEach((link) => {
      link.addEventListener("click", () => setActiveNav(link.dataset.nav));
    });

    if (role === "STUDENT") renderStudentWorkspace();
    if (role === "STAFF") renderStaffWorkspace();
    if (role === "ADMIN") renderAdminWorkspace();
  }

  // ===== Role workspaces =====
  function sectionCard(row) {
    return `<div class="col-md-6 col-xl-4"><div class="panel course-card" data-section-id="${escapeHtml(row.SectionID)}" style="cursor:pointer">
      <div class="course-thumb"></div>
      <div class="panel-body">
        <div class="cell-primary">${escapeHtml(row.CourseCode)} · ${escapeHtml(row.CourseName)}</div>
        <div class="cell-muted">${escapeHtml(row.SectionCode)} · ${escapeHtml(row.ComponentType)} · ${escapeHtml(row.RoomCode)}</div>
        <div class="cell-muted">${dayName(row.DayOfWeek)} ${formatTime(row.StartTime)}–${formatTime(row.EndTime)}</div>
        <div class="cell-muted">${escapeHtml(row.AcademicYear)} · HK${escapeHtml(row.TermNo)}</div>
      </div>
    </div></div>`;
  }

  async function renderStudentWorkspace() {
    const inner = $("#roleWorkspaceInner");
    inner.innerHTML = `<div class="section-heading"><div><h2>Khóa học của tôi</h2><p>Các lớp bạn đã ghi danh. Bấm vào lớp để xem chi tiết.</p></div></div>
      <div class="row g-3" id="studentCourses"></div>
      <div id="studentDetail" class="mt-3"></div>`;
    try {
      const payload = await api("/api/student/sections");
      const rows = payload.data || [];
      const container = $("#studentCourses");
      container.innerHTML = rows.length
        ? rows.map(sectionCard).join("")
        : '<div class="col-12"><div class="empty-state"><strong>Chưa có khóa học</strong></div></div>';
      container.querySelectorAll("[data-section-id]").forEach((card) => {
        card.addEventListener("click", () => loadStudentSection(card.dataset.sectionId));
      });
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  async function loadStudentSection(sectionId) {
    const detail = $("#studentDetail");
    detail.innerHTML = '<div class="panel"><div class="panel-body">Đang tải lớp…</div></div>';
    try {
      const [sec, ann, res, asg, grd] = await Promise.allSettled([
        api(`/api/student/sections/${sectionId}`),
        api(`/api/student/sections/${sectionId}/announcements`),
        api(`/api/student/sections/${sectionId}/resources`),
        api(`/api/student/sections/${sectionId}/assessments`),
        api("/api/student/grades"),
      ]);
      const section = sec.status === "fulfilled" ? sec.value.data : {};
      detail.innerHTML = studentSectionHtml(section, ann, res, asg, grd);
      detail.querySelectorAll("[data-submit-assignment]").forEach((btn) => {
        btn.addEventListener("click", () => submitStudentAssignment(btn.dataset.submitAssignment));
      });
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  function listValue(promise, field) {
    return promise.status === "fulfilled" ? promise.value.data || [] : [];
  }

  function studentSectionHtml(section, ann, res, asg, grd) {
    const announcements = listValue(ann);
    const resources = listValue(res);
    const assessments = listValue(asg);
    const grades = listValue(grd);
    const gradeRows = grades
      .filter((g) => Number(g.EnrollmentID) || true)
      .slice(0, 50)
      .map(
        (g) => `<tr><td>${escapeHtml(g.Title)}</td><td>${escapeHtml(g.SectionCode)}</td>
          <td class="text-end">${formatNumber(g.Score)}/${formatNumber(g.MaxScore)}</td>
          <td class="text-end">${formatPercent((g.Score / g.MaxScore) * 100)}</td></tr>`,
      )
      .join("");
    const asgRows = assessments
      .map((a) => {
        const isAssignment = a.AssessmentType === "ASSIGNMENT";
        const due = isAssignment ? `Hạn: ${formatDate(a.DueDate)}` : `Đóng: ${formatDate(a.CloseTime)} · ${a.DurationMinutes} phút`;
        return `<div class="list-group-item d-flex justify-content-between align-items-center">
          <div><div class="cell-primary">${escapeHtml(a.Title)}</div>
          <div class="cell-muted">${isAssignment ? "Bài tập" : "Quiz"} · ${due} · Điểm tối đa ${formatNumber(a.MaxScore)}</div></div>
          <div class="text-end">
            <div>${a.Score != null ? `${formatNumber(a.Score)}/${formatNumber(a.MaxScore)}` : "Chưa chấm"}</div>
            ${isAssignment ? `<button class="btn btn-sm btn-outline-primary mt-1" data-submit-assignment="${escapeHtml(a.AssessmentID)}">Nộp bài</button>` : ""}
          </div></div>`;
      })
      .join("");
    return `<div class="panel">
      <div class="panel-header"><div><h3 class="panel-title">${escapeHtml(section.CourseCode)} · ${escapeHtml(section.CourseName)}</h3>
        <p class="panel-subtitle">${escapeHtml(section.SectionCode)} · ${escapeHtml(section.ComponentType)} · ${escapeHtml(section.InstructorName || "Chưa có giảng viên")}</p></div>
        ${statusBadge(section.EnrollmentStatus)}</div>
      <div class="panel-body">
        <h4 class="h6">Thông báo</h4>
        ${announcements.length ? announcements.map((a) => `<div class="mb-2"><strong>${escapeHtml(a.Title)}</strong><div class="cell-muted">${formatDate(a.PostedAt)}</div><div>${escapeHtml(a.Content)}</div></div>`).join("") : '<div class="cell-muted">Không có thông báo.</div>'}
        <hr>
        <h4 class="h6">Tài liệu</h4>
        ${resources.length ? `<ul class="note-list">${resources.map((r) => `<li><strong>${escapeHtml(r.Title)}</strong> <span class="cell-muted">(${escapeHtml(r.ResourceType)})</span> — ${escapeHtml(r.ResourceURL)}</li>`).join("")}</ul>` : '<div class="cell-muted">Không có tài liệu.</div>'}
        <hr>
        <h4 class="h6">Bài tập & Quiz</h4>
        <div class="list-group">${asgRows || '<div class="cell-muted">Không có hoạt động đánh giá.</div>'}</div>
        <hr>
        <h4 class="h6">Điểm của tôi</h4>
        <div class="table-responsive"><table class="table"><thead><tr><th>Hoạt động</th><th>Lớp</th><th class="text-end">Điểm</th><th class="text-end">%</th></tr></thead>
        <tbody>${gradeRows || '<tr><td colspan="4" class="cell-muted">Chưa có điểm.</td></tr>'}</tbody></table></div>
      </div></div>`;
  }

  async function submitStudentAssignment(assessmentId) {
    const fileUrl = window.prompt("Tên tệp (metadata, không upload thật):", "bai-nop.pdf");
    if (fileUrl === null) return;
    try {
      await api(`/api/student/assignments/${assessmentId}/submissions`, {
        method: "POST",
        body: { file_name: fileUrl, file_url: "/uploads/" + fileUrl, file_size: 1024 },
      });
      notify("Đã nộp bài.", "success");
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  async function renderStaffWorkspace() {
    const inner = $("#roleWorkspaceInner");
    inner.innerHTML = `<div class="section-heading"><div><h2>Lớp tôi dạy</h2><p>Các lớp bạn là giảng viên phụ trách chính.</p></div></div>
      <div class="row g-3" id="staffSections"></div>
      <div id="staffDetail" class="mt-3"></div>`;
    try {
      const payload = await api("/api/staff/sections");
      const rows = payload.data || [];
      const container = $("#staffSections");
      container.innerHTML = rows.length
        ? rows.map(sectionCard).join("")
        : '<div class="col-12"><div class="empty-state"><strong>Chưa có lớp phụ trách</strong></div></div>';
      container.querySelectorAll("[data-section-id]").forEach((card) => {
        card.addEventListener("click", () => loadStaffSection(card.dataset.sectionId));
      });
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  async function loadStaffSection(sectionId) {
    const detail = $("#staffDetail");
    detail.innerHTML = '<div class="panel"><div class="panel-body">Đang tải…</div></div>';
    try {
      const [students, ann, res, asg, subs, grd] = await Promise.allSettled([
        api(`/api/staff/sections/${sectionId}/students`),
        api(`/api/staff/sections/${sectionId}/announcements`),
        api(`/api/staff/sections/${sectionId}/resources`),
        api(`/api/staff/sections/${sectionId}/assessments`),
        api(`/api/staff/sections/${sectionId}/submissions`),
        api(`/api/staff/sections/${sectionId}/grades`),
      ]);
      detail.innerHTML = staffSectionHtml(sectionId, students, ann, res, asg, subs, grd);
      attachStaffActions(sectionId);
    } catch (error) {
      notify(error.message, "danger");
    }
  }

  function staffSectionHtml(sectionId, students, ann, res, asg, subs, grd) {
    const studentRows = listValue(students).map((s) => `<tr><td>${escapeHtml(s.StudentName)}</td><td>${escapeHtml(s.StudentCode)}</td><td>${statusBadge(s.EnrollmentStatus)}</td></tr>`).join("");
    const annRows = listValue(ann).map((a) => `<tr><td>${escapeHtml(a.Title)}</td><td>${formatDate(a.PostedAt)}</td><td class="text-end"><button class="btn btn-sm btn-outline-danger" data-del-ann="${escapeHtml(a.AnnouncementID)}">Xóa</button></td></tr>`).join("");
    const resRows = listValue(res).map((r) => `<tr><td>${escapeHtml(r.Title)}</td><td>${escapeHtml(r.ResourceType)}</td><td>${escapeHtml(r.ResourceURL)}</td><td class="text-end"><button class="btn btn-sm btn-outline-danger" data-unpost="${escapeHtml(r.ResourceID)}">Gỡ</button></td></tr>`).join("");
    const asgRows = listValue(asg).map((a) => `<tr><td>${escapeHtml(a.Title)}</td><td>${escapeHtml(a.AssessmentType)}</td><td class="text-end">${formatNumber(a.MaxScore)}</td><td class="text-end"><button class="btn btn-sm btn-outline-danger" data-del-asg="${escapeHtml(a.AssessmentID)}">Xóa</button></td></tr>`).join("");
    const subRows = listValue(subs).map((s) => `<tr><td>${escapeHtml(s.StudentName)}</td><td>${escapeHtml(s.AssignmentTitle)}</td><td>Lần ${escapeHtml(s.AttemptNo)}</td><td>${s.Score != null ? formatNumber(s.Score) : "—"}</td>
      <td class="text-end"><button class="btn btn-sm btn-outline-primary" data-grade-sub="${escapeHtml(s.SubmissionID)}">Chấm</button></td></tr>`).join("");
    const gradeRows = listValue(grd).map((g) => `<tr><td>${escapeHtml(g.StudentName)}</td><td>${escapeHtml(g.AssessmentTitle)}</td><td class="text-end">${formatNumber(g.Score)}</td><td>${g.IsPublished ? "Đã công bố" : "Ẩn"}</td></tr>`).join("");
    return `<div class="panel">
      <div class="panel-header"><h3 class="panel-title">Quản lý lớp #${escapeHtml(sectionId)}</h3></div>
      <div class="panel-body">
        <div class="row g-3">
          <div class="col-lg-6"><div class="panel"><div class="panel-header"><h4 class="h6 mb-0">Sinh viên</h4></div>
            <div class="table-responsive"><table class="table"><thead><tr><th>Tên</th><th>MSSV</th><th>Trạng thái</th></tr></thead><tbody>${studentRows || '<tr><td colspan="3" class="cell-muted">Không có.</td></tr>'}</tbody></table></div></div></div>
          <div class="col-lg-6"><div class="panel"><div class="panel-header"><h4 class="h6 mb-0">Thông báo</h4><button class="btn btn-sm btn-primary" data-add-ann>+ Thêm</button></div>
            <div class="table-responsive"><table class="table"><thead><tr><th>Tiêu đề</th><th>Đăng lúc</th><th></th></tr></thead><tbody>${annRows || '<tr><td colspan="3" class="cell-muted">Không có.</td></tr>'}</tbody></table></div></div></div>
          <div class="col-lg-6"><div class="panel"><div class="panel-header"><h4 class="h6 mb-0">Tài liệu</h4><button class="btn btn-sm btn-primary" data-add-res>+ Thêm</button></div>
            <div class="table-responsive"><table class="table"><thead><tr><th>Tiêu đề</th><th>Loại</th><th>URL</th><th></th></tr></thead><tbody>${resRows || '<tr><td colspan="4" class="cell-muted">Không có.</td></tr>'}</tbody></table></div></div></div>
          <div class="col-lg-6"><div class="panel"><div class="panel-header"><h4 class="h6 mb-0">Bài tập & Quiz</h4><button class="btn btn-sm btn-primary" data-add-asg>+ Thêm</button></div>
            <div class="table-responsive"><table class="table"><thead><tr><th>Tiêu đề</th><th>Loại</th><th class="text-end">Điểm tối đa</th><th></th></tr></thead><tbody>${asgRows || '<tr><td colspan="4" class="cell-muted">Không có.</td></tr>'}</tbody></table></div></div></div>
          <div class="col-lg-6"><div class="panel"><div class="panel-header"><h4 class="h6 mb-0">Bài nộp</h4></div>
            <div class="table-responsive"><table class="table"><thead><tr><th>Sinh viên</th><th>Bài tập</th><th>Lần</th><th>Điểm</th><th></th></tr></thead><tbody>${subRows || '<tr><td colspan="5" class="cell-muted">Không có.</td></tr>'}</tbody></table></div></div></div>
          <div class="col-lg-6"><div class="panel"><div class="panel-header"><h4 class="h6 mb-0">Điểm</h4></div>
            <div class="table-responsive"><table class="table"><thead><tr><th>Sinh viên</th><th>Hoạt động</th><th class="text-end">Điểm</th><th>Trạng thái</th></tr></thead><tbody>${gradeRows || '<tr><td colspan="4" class="cell-muted">Không có.</td></tr>'}</tbody></table></div></div></div>
        </div>
      </div></div>`;
  }

  function attachStaffActions(sectionId) {
    const inner = $("#roleWorkspaceInner");
    inner.querySelectorAll("[data-del-ann]").forEach((btn) => btn.addEventListener("click", async () => {
      try { await api(`/api/staff/announcements/${btn.dataset.delAnn}`, { method: "DELETE" }); notify("Đã xóa thông báo."); loadStaffSection(sectionId); } catch (e) { notify(e.message, "danger"); }
    }));
    inner.querySelectorAll("[data-unpost]").forEach((btn) => btn.addEventListener("click", async () => {
      try { await api(`/api/staff/sections/${sectionId}/resources/${btn.dataset.unpost}`, { method: "DELETE" }); notify("Đã gỡ tài liệu."); loadStaffSection(sectionId); } catch (e) { notify(e.message, "danger"); }
    }));
    inner.querySelectorAll("[data-del-asg]").forEach((btn) => btn.addEventListener("click", async () => {
      try { await api(`/api/staff/assessments/${btn.dataset.delAsg}`, { method: "DELETE" }); notify("Đã xóa assessment."); loadStaffSection(sectionId); } catch (e) { notify(e.message, "danger"); }
    }));
    inner.querySelectorAll("[data-grade-sub]").forEach((btn) => btn.addEventListener("click", async () => {
      const score = window.prompt("Nhập điểm cho bài nộp:", "");
      if (score === null) return;
      try { await api(`/api/staff/submissions/${btn.dataset.gradeSub}/grade`, { method: "PATCH", body: { score: Number(score) } }); notify("Đã chấm bài."); loadStaffSection(sectionId); } catch (e) { notify(e.message, "danger"); }
    }));
    inner.querySelector("[data-add-ann]")?.addEventListener("click", () => {
      const title = window.prompt("Tiêu đề thông báo:", "");
      if (title === null) return;
      const content = window.prompt("Nội dung:", "") || "";
      api(`/api/staff/sections/${sectionId}/announcements`, { method: "POST", body: { title, content } }).then(() => { notify("Đã thêm thông báo."); loadStaffSection(sectionId); }).catch((e) => notify(e.message, "danger"));
    });
    inner.querySelector("[data-add-res]")?.addEventListener("click", () => {
      const title = window.prompt("Tiêu đề tài liệu:", "");
      if (title === null) return;
      const url = window.prompt("URL:", "/resources/file.pdf") || "/resources/file.pdf";
      api(`/api/staff/sections/${sectionId}/resources`, { method: "POST", body: { title, description: "", resource_type: "DOCUMENT", resource_url: url, display_order: 0 } }).then(() => { notify("Đã thêm tài liệu."); loadStaffSection(sectionId); }).catch((e) => notify(e.message, "danger"));
    });
    inner.querySelector("[data-add-asg]")?.addEventListener("click", () => {
      const title = window.prompt("Tiêu đề bài tập:", "");
      if (title === null) return;
      api(`/api/staff/sections/${sectionId}/assignments`, { method: "POST", body: { title, description: "", max_score: 10, max_attempts: 3, open_date: "2026-11-01 00:00:00", due_date: "2026-12-31 23:59:59", allow_late: true, attachments: [] } }).then(() => { notify("Đã thêm bài tập."); loadStaffSection(sectionId); }).catch((e) => notify(e.message, "danger"));
    });
  }

  async function renderAdminWorkspace() {
    const inner = $("#roleWorkspaceInner");
    inner.innerHTML = `<div class="section-heading"><div><h2>Quản trị</h2><p>Quản lý tài khoản, danh mục và khám phá dữ liệu.</p></div></div>
      <ul class="nav nav-pills gap-2 mb-3" id="adminTabs">
        <li class="nav-item"><button class="nav-link active" data-admin-tab="users">Người dùng</button></li>
        <li class="nav-item"><button class="nav-link" data-admin-tab="faculties">Khoa</button></li>
        <li class="nav-item"><button class="nav-link" data-admin-tab="semesters">Học kỳ</button></li>
        <li class="nav-item"><button class="nav-link" data-admin-tab="courses">Môn học</button></li>
        <li class="nav-item"><button class="nav-link" data-admin-tab="components">Thành phần</button></li>
        <li class="nav-item"><button class="nav-link" data-admin-tab="sections">Lớp học phần</button></li>
        <li class="nav-item"><button class="nav-link" data-admin-tab="data">Dữ liệu</button></li>
      </ul>
      <div id="adminTabContent"></div>`;
    $("#adminTabs").querySelectorAll("[data-admin-tab]").forEach((tab) => {
      tab.addEventListener("click", () => {
        $("#adminTabs").querySelectorAll("[data-admin-tab]").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        loadAdminTab(tab.dataset.adminTab);
      });
    });
    await loadAdminTab("users");
  }

  async function loadAdminTab(tab) {
    const content = $("#adminTabContent");
    content.innerHTML = '<div class="panel"><div class="panel-body">Đang tải…</div></div>';
    try {
      if (tab === "users") {
        const users = (await api("/api/admin/users")).data || [];
        content.innerHTML = `<div class="panel"><div class="table-responsive"><table class="table"><thead><tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th class="text-end">Khóa/Mở</th></tr></thead>
          <tbody>${users.map((u) => `<tr><td>${escapeHtml(u.UserID)}</td><td>${escapeHtml(u.FullName)}</td><td>${escapeHtml(u.Email)}</td><td>${escapeHtml(u.Role)}</td><td>${statusBadge(u.AccountStatus)}</td>
          <td class="text-end"><button class="btn btn-sm ${u.AccountStatus === "ACTIVE" ? "btn-outline-danger" : "btn-outline-success"}" data-toggle-status="${escapeHtml(u.UserID)}" data-status="${u.AccountStatus === "ACTIVE" ? "LOCKED" : "ACTIVE"}">${u.AccountStatus === "ACTIVE" ? "Khóa" : "Mở khóa"}</button></td></tr>`).join("")}</tbody></table></div></div>`;
        content.querySelectorAll("[data-toggle-status]").forEach((btn) => btn.addEventListener("click", async () => {
          try { await api(`/api/admin/users/${btn.dataset.toggleStatus}/status`, { method: "PATCH", body: { status: btn.dataset.status } }); notify("Đã cập nhật trạng thái."); loadAdminTab("users"); } catch (e) { notify(e.message, "danger"); }
        }));
      } else if (tab === "faculties") {
        const rows = (await api("/api/admin/faculties")).data || [];
        content.innerHTML = genericTable(["FacultyID", "FacultyName", "FacultyNameEN"], rows);
      } else if (tab === "semesters") {
        const rows = (await api("/api/admin/semesters")).data || [];
        content.innerHTML = genericTable(["SemesterID", "AcademicYear", "TermNo", "StartDate", "EndDate"], rows);
      } else if (tab === "courses") {
        const rows = (await api("/api/admin/courses")).data || [];
        content.innerHTML = genericTable(["CourseID", "CourseCode", "CourseName", "Credits", "FacultyName"], rows);
      } else if (tab === "components") {
        const rows = (await api("/api/admin/components")).data || [];
        content.innerHTML = genericTable(["ComponentID", "CourseCode", "ComponentType", "ComponentName"], rows);
      } else if (tab === "sections") {
        const rows = (await api("/api/admin/sections")).data || [];
        content.innerHTML = genericTable(["SectionID", "SectionCode", "CourseCode", "ComponentType", "AcademicYear", "TermNo", "InstructorName", "Capacity", "SectionStatus"], rows);
      } else if (tab === "data") {
        const tables = (await api("/api/admin/data/tables")).data || [];
        const options = tables.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
        content.innerHTML = `<div class="panel"><div class="panel-body">
          <label class="form-label">Chọn bảng</label>
          <select class="form-select" id="exploreTable">${options}</select>
          <div class="mt-3" id="exploreResult"><span class="cell-muted">Chọn bảng để xem dữ liệu.</span></div></div></div>`;
        $("#exploreTable").addEventListener("change", async () => {
          const table = $("#exploreTable").value;
          const rows = (await api(`/api/admin/data/${table}?limit=50`)).data || [];
          $("#exploreResult").innerHTML = genericTable(Object.keys(rows[0] || {}), rows);
        });
      }
    } catch (error) {
      content.innerHTML = `<div class="empty-state"><strong>Lỗi</strong><span>${escapeHtml(error.message)}</span></div>`;
    }
  }

  function genericTable(columns, rows) {
    if (!columns.length) return '<div class="cell-muted">Không có dữ liệu.</div>';
    const head = columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
    const body = rows.map((r) => `<tr>${columns.map((c) => `<td>${escapeHtml(r[c] ?? "")}</td>`).join("")}</tr>`).join("");
    return `<div class="panel"><div class="table-responsive"><table class="table"><thead><tr>${head}</tr></thead><tbody>${body || '<tr><td class="cell-muted">Không có.</td></tr>'}</tbody></table></div></div>`;
  }

  async function init() {
    attachEvents();
    const loggedIn = await checkAuth();
    if (!loggedIn) return;
    await loadCatalog();
    await Promise.allSettled([
      loadDashboard(),
      loadHealth(),
      loadEnrollments(),
      loadStatistics(),
    ]);
    window.setInterval(() => loadHealth(false), 60_000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
