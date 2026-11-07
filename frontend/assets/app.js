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
  };

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
    attachTableActions();
    attachNavigation();
  }

  async function init() {
    attachEvents();
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
