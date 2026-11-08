from __future__ import annotations

from backend.errors import NotFoundError
from backend.repositories.admin_repository import EXPLORER_TABLES, AdminRepository


class AdminService:
    def __init__(self, repository: AdminRepository) -> None:
        self.repository = repository

    def users(self) -> list[dict]:
        return self.repository.users()

    def create_user(self, email: str, full_name: str, role: str, extra: dict) -> dict:
        user_id = self.repository.create_user(email, full_name, role, extra)
        return {"user_id": user_id}

    def set_status(self, user_id: int, status: str) -> dict:
        self.repository.set_status(user_id, status)
        return {"user_id": user_id, "status": status}

    def faculties(self) -> list[dict]:
        return self.repository.faculties()

    def create_faculty(self, name: str, name_en: str | None) -> dict:
        return {"faculty_id": self.repository.create_faculty(name, name_en)}

    def update_faculty(self, faculty_id: int, name: str, name_en: str | None) -> dict:
        self.repository.update_faculty(faculty_id, name, name_en)
        return {"faculty_id": faculty_id}

    def delete_faculty(self, faculty_id: int) -> None:
        self.repository.delete_faculty(faculty_id)

    def semesters(self) -> list[dict]:
        return self.repository.semesters()

    def create_semester(self, year: str, term: int, start: str, end: str) -> dict:
        return {"semester_id": self.repository.create_semester(year, term, start, end)}

    def update_semester(self, semester_id: int, year: str, term: int, start: str, end: str) -> dict:
        self.repository.update_semester(semester_id, year, term, start, end)
        return {"semester_id": semester_id}

    def delete_semester(self, semester_id: int) -> None:
        self.repository.delete_semester(semester_id)

    def courses(self) -> list[dict]:
        return self.repository.courses()

    def create_course(self, code: str, name: str, credits: int, faculty_id: int, admin_id: int) -> dict:
        return {"course_id": self.repository.create_course(code, name, credits, faculty_id, admin_id)}

    def update_course(self, course_id: int, code: str, name: str, credits: int, faculty_id: int) -> dict:
        self.repository.update_course(course_id, code, name, credits, faculty_id)
        return {"course_id": course_id}

    def delete_course(self, course_id: int) -> None:
        self.repository.delete_course(course_id)

    def components(self) -> list[dict]:
        return self.repository.components()

    def create_component(self, course_id: int, ctype: str, name: str) -> dict:
        return {"component_id": self.repository.create_component(course_id, ctype, name)}

    def update_component(self, component_id: int, ctype: str, name: str) -> dict:
        self.repository.update_component(component_id, ctype, name)
        return {"component_id": component_id}

    def delete_component(self, component_id: int) -> None:
        self.repository.delete_component(component_id)

    def sections(self) -> list[dict]:
        return self.repository.sections()

    def create_section(self, payload: dict) -> dict:
        return {"section_id": self.repository.create_section(payload)}

    def update_section(self, section_id: int, payload: dict) -> dict:
        self.repository.update_section(section_id, payload)
        return {"section_id": section_id}

    def delete_section(self, section_id: int) -> None:
        self.repository.delete_section(section_id)

    def explore(self, table: str, limit: int) -> list[dict]:
        if table not in EXPLORER_TABLES:
            raise NotFoundError("Bang khong duoc ho tro.")
        return self.repository.explore(table, limit)
