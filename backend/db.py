from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterable, Mapping

import pymysql
from pymysql.cursors import DictCursor


class Database:
    """Small PyMySQL wrapper.

    All repository SQL is parameterized. Procedure names are restricted to
    identifier characters because MySQL does not permit placeholders for names.
    """

    def __init__(self, config: Mapping[str, Any]) -> None:
        self._config = {
            "host": config["MYSQL_HOST"],
            "port": int(config["MYSQL_PORT"]),
            "user": config["MYSQL_USER"],
            "password": config["MYSQL_PASSWORD"],
            "database": config["MYSQL_DATABASE"],
            "charset": "utf8mb4",
            "cursorclass": DictCursor,
            "autocommit": False,
            "connect_timeout": int(config.get("MYSQL_CONNECT_TIMEOUT", 5)),
            "read_timeout": 15,
            "write_timeout": 15,
        }

    @contextmanager
    def connection(self):
        conn = pymysql.connect(**self._config)
        try:
            yield conn
        finally:
            conn.close()

    def fetch_all(self, sql: str, params: Iterable[Any] | None = None) -> list[dict]:
        with self.connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(sql, tuple(params or ()))
                return list(cursor.fetchall())

    def fetch_one(self, sql: str, params: Iterable[Any] | None = None) -> dict | None:
        rows = self.fetch_all(sql, params)
        return rows[0] if rows else None

    def call_procedure(self, name: str, params: Iterable[Any] | None = None) -> list[dict]:
        if not name.replace("_", "").isalnum():
            raise ValueError("Unsafe stored procedure name")
        values = tuple(params or ())
        placeholders = ", ".join(["%s"] * len(values))
        with self.connection() as conn:
            try:
                with conn.cursor() as cursor:
                    cursor.execute(f"CALL `{name}`({placeholders})", values)
                    rows = list(cursor.fetchall())
                    while cursor.nextset():
                        pass
                conn.commit()
                return rows
            except Exception:
                conn.rollback()
                raise

    def call_procedure_one(self, name: str, params: Iterable[Any] | None = None) -> dict | None:
        rows = self.call_procedure(name, params)
        return rows[0] if rows else None

    def ping(self) -> dict:
        row = self.fetch_one(
            "SELECT VERSION() AS version, DATABASE() AS database_name, NOW() AS server_time"
        )
        return row or {}
