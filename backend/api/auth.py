from flask import Blueprint, jsonify, request, session
from backend.errors import NotFoundError

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def get_db():
    from flask import current_app
    return current_app.extensions["db"]


@bp.get("/roles")
def auth_roles():
    return jsonify({
        "data": [
            {"role": "STUDENT", "label": "Sinh viên", "description": "Truy cập khóa học đã ghi danh, nộp bài, xem điểm."},
            {"role": "STAFF", "label": "Cán bộ", "description": "Quản lý lớp phụ trách, tạo bài tập, chấm điểm."},
            {"role": "ADMIN", "label": "Quản trị viên", "description": "Quản lý tài khoản và môn học."}
        ]
    })


@bp.get("/accounts")
def auth_accounts():
    role = request.args.get("role")
    db = get_db()
    
    if role == "STUDENT":
        rows = db.fetch_all("""
            SELECT u.UserID, u.FullName, u.Email, u.AvatarURL, u.AccountStatus,
                   s.StudentCode, s.FacultyID
            FROM Student s JOIN UserAccount u ON s.UserID = u.UserID
            ORDER BY u.FullName
        """)
    elif role == "STAFF":
        rows = db.fetch_all("""
            SELECT u.UserID, u.FullName, u.Email, u.AvatarURL, u.AccountStatus,
                   NULL AS StudentCode, s.FacultyID
            FROM Staff s JOIN UserAccount u ON s.UserID = u.UserID
            ORDER BY u.FullName
        """)
    elif role == "ADMIN":
        rows = db.fetch_all("""
            SELECT u.UserID, u.FullName, u.Email, u.AvatarURL, u.AccountStatus
            FROM Admin s JOIN UserAccount u ON s.UserID = u.UserID
            ORDER BY u.FullName
        """)
    else:
        return jsonify({"data": []})
    
    return jsonify({"data": rows})


@bp.post("/login")
def auth_login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": {"code": "invalid_json", "message": "Body phai la JSON object."}}), 400
    
    role = data.get("role")
    user_id = data.get("user_id")
    
    if not role or not user_id:
        return jsonify({"error": {"code": "validation_error", "message": "Thieu role hoac user_id."}}), 422
    
    db = get_db()
    valid_roles = {"STUDENT": "Student", "STAFF": "Staff", "ADMIN": "Admin"}
    table = valid_roles.get(role)
    if not table:
        return jsonify({"error": {"code": "validation_error", "message": "Role khong hop le."}}), 400
    
    row = db.fetch_one("""
        SELECT u.UserID, u.FullName, u.Email, u.AvatarURL, u.AccountStatus, u.LastAccessAt
        FROM UserAccount u WHERE u.UserID = %s
    """, (user_id,))

    if not row:
        return jsonify({"error": {"code": "not_found", "message": "Khong tim thay tai khoan."}}), 404

    # Verify the account actually belongs to the requested role subclass.
    member = db.fetch_one(f"SELECT UserID FROM `{table}` WHERE UserID = %s", (user_id,))
    if not member:
        return jsonify({"error": {"code": "not_found", "message": "Tai khoan khong thuoc vai tro nay."}}), 404
    
    if row["AccountStatus"] != "ACTIVE":
        return jsonify({"error": {"code": "account_inactive", "message": "Tai khoan khong hoat dong, khong the dang nhap."}}), 403
    
    session["user_id"] = user_id
    session["role"] = role
    session["full_name"] = row["FullName"]
    session["email"] = row["Email"]
    session["avatar_url"] = row["AvatarURL"]
    
    db.execute("UPDATE UserAccount SET LastAccessAt = NOW() WHERE UserID = %s", (user_id,))
    
    return jsonify({
        "data": {
            "user": row,
            "role": role,
            "message": "Dang nhap thanh cong."
        }
    })


@bp.post("/logout")
def auth_logout():
    session.clear()
    return jsonify({"data": {"message": "Da dang xuat."}})


@bp.get("/me")
def auth_me():
    if "user_id" not in session or "role" not in session:
        return jsonify({"error": {"code": "unauthorized", "message": "Chua dang nhap."}}), 401
    
    db = get_db()
    row = db.fetch_one("""
        SELECT u.UserID, u.FullName, u.Email, u.AvatarURL, u.AccountStatus, u.LastAccessAt
        FROM UserAccount u WHERE u.UserID = %s
    """, (session["user_id"],))
    
    return jsonify({
        "data": {
            "user": row,
            "role": session["role"],
            "full_name": session.get("full_name"),
            "email": session.get("email"),
            "avatar_url": session.get("avatar_url"),
        }
    })