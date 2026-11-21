import os
import re
import secrets
import hashlib
import smtplib
import sqlite3
import logging
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional, Tuple
import bcrypt
from scrapers.database import get_db_cursor

logger = logging.getLogger("scrapers.auth")

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SQLITE_DB_PATH = os.path.join(ROOT_DIR, "unstuck_auth.db")

# SMTP Configuration via environment variables
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USER or "noreply@unstuck.app")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

# Cooldown and limits
OTP_EXPIRY_MINUTES = 5
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_MAX_ATTEMPTS = 5

PASSWORD_REGEX = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]).{10,}$"
)

def get_sqlite_conn():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_auth_tables():
    """Initializes users and otp_verifications tables in PostgreSQL (or SQLite fallback)."""
    # 1. Try PostgreSQL
    try:
        sql = """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(150) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            is_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            verified_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS otp_verifications (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            otp_hash VARCHAR(255) NOT NULL,
            attempts INTEGER DEFAULT 0,
            max_attempts INTEGER DEFAULT 5,
            is_used BOOLEAN DEFAULT FALSE,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);
        """
        with get_db_cursor(commit=True) as cur:
            cur.execute(sql)
        logger.info("Authentication tables initialized in PostgreSQL successfully.")
        return
    except Exception as e:
        logger.warning(f"PostgreSQL not available for auth ({e}). Using local SQLite fallback.")

    # 2. SQLite fallback
    conn = get_sqlite_conn()
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_verified INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        verified_at TEXT
    );
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS otp_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        otp_hash TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 5,
        is_used INTEGER DEFAULT 0,
        expires_at TEXT NOT NULL,
        last_sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()
    conn.close()
    logger.info("Authentication tables initialized in local SQLite fallback.")

def validate_password_strength(password: str) -> Tuple[bool, str]:
    if not password or len(password) < 6:
        return False, "Password must be at least 6 characters long."
    return True, ""

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def hash_otp(otp_code: str) -> str:
    """Cryptographic SHA-256 hash for OTP so plain code is never stored in DB."""
    return hashlib.sha256(otp_code.encode("utf-8")).hexdigest()

def generate_secure_otp() -> str:
    """Generates a secure 6-digit random numeric OTP."""
    return "".join(secrets.choice("0123456789") for _ in range(6))

def send_general_email(recipient_email: str, subject: str, html_content: str) -> Tuple[bool, str]:
    """Sends a general HTML email notification via SMTP."""
    if not recipient_email:
        return False, "Recipient email is required"
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        err_msg = "SMTP is not configured in .env (SMTP_HOST, SMTP_USER, SMTP_PASSWORD required)."
        logger.warning(err_msg)
        return False, err_msg
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM_EMAIL or SMTP_USER
        msg["To"] = recipient_email
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20)
        if SMTP_USE_TLS:
            server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(msg["From"], [recipient_email], msg.as_string())
        server.quit()
        logger.info(f"Notification email dispatched to {recipient_email}")
        return True, "Email sent successfully"
    except Exception as e:
        logger.error(f"SMTP notification failed: {e}")
        return False, str(e)


def send_real_email_otp(recipient_email: str, recipient_name: str, otp_code: str) -> Tuple[bool, str]:
    """
    Delivers the verification code via real SMTP.
    Returns (True, "sent") or (False, error_reason).
    """
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        err_msg = (
            "SMTP is not configured on the backend. Please configure SMTP_HOST, "
            "SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in .env."
        )
        logger.error(err_msg)
        return False, err_msg

    subject = "Verify your Unstuck account"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf7f2; margin: 0; padding: 24px; color: #1c1917; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e7e5e4; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .logo {{ font-size: 22px; font-weight: 800; color: #881337; margin-bottom: 24px; }}
        .code-box {{ margin: 28px 0; padding: 18px; background: #fff1f2; border: 1px dashed #f43f5e; border-radius: 10px; text-align: center; }}
        .code {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #9f1239; }}
        .footer {{ margin-top: 32px; font-size: 13px; color: #78716c; line-height: 1.6; border-top: 1px solid #f5f5f4; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">UNSTUCK <span style="font-size: 12px; background: #be123c; color: white; padding: 2px 8px; border-radius: 99px;">RADAR</span></div>
        <h2 style="margin-top: 0;">Hello, {recipient_name}!</h2>
        <p>Thank you for creating an account with <strong>Unstuck</strong>. To verify that you own this email address and activate your account, please enter the one-time verification code below:</p>
        
        <div class="code-box">
          <div class="code">{otp_code}</div>
        </div>

        <p style="font-size: 14px; color: #57534e;">
          ⏱️ This verification code is valid for <strong>5 minutes</strong> and can only be used once.
        </p>
        
        <div class="footer">
          If you did not request this verification, please safely ignore this email. No changes will be made to your email or account without this code.
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = (
        f"Hello, {recipient_name}!\n\n"
        f"Your Unstuck verification code is: {otp_code}\n\n"
        f"This code will expire in 5 minutes.\n"
        f"If you did not request this, please ignore this email."
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Unstuck Radar <{SMTP_FROM_EMAIL}>"
    msg["To"] = recipient_email

    msg.attach(MIMEText(plain_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20)
            server.ehlo()
            server.starttls()
            server.ehlo()
        else:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=20)
            server.ehlo()

        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, [recipient_email], msg.as_string())
        server.quit()
        logger.info(f"OTP email sent successfully to {recipient_email}")
        return True, "Email sent successfully."
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {e}")
        return False, str(e)

_pg_cache = {"status": None, "last_check": 0}

def is_postgres_available() -> bool:
    import time
    now_ts = time.time()
    if _pg_cache["status"] is not None and (now_ts - _pg_cache["last_check"] < 15):
        return _pg_cache["status"]
    try:
        from scrapers.database import get_db_health
        health = get_db_health()
        _pg_cache["status"] = bool(health.get("connected"))
        _pg_cache["last_check"] = now_ts
        return _pg_cache["status"]
    except Exception:
        _pg_cache["status"] = False
        _pg_cache["last_check"] = now_ts
        return False

def register_pending_user(full_name: str, email: str, password: str) -> Dict[str, Any]:
    """
    Step 1-5 of registration flow:
    - Validates fields & password
    - Upserts/creates pending unverified user record with hashed password
    - Generates 6-digit secure OTP and hashes it
    - Stores OTP with 5 min expiry and cooldown
    - Sends real email
    """
    clean_email = email.strip().lower()
    clean_name = full_name.strip()

    is_valid, msg = validate_password_strength(password)
    if not is_valid:
        return {"success": False, "error": msg}

    pwd_hash = hash_password(password)
    now = datetime.now(timezone.utc)
    now_str = now.isoformat()
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)
    expires_at_str = expires_at.isoformat()

    plain_otp = generate_secure_otp()
    hashed_otp = hash_otp(plain_otp)

    if is_postgres_available():
        try:
            with get_db_cursor(commit=True) as cur:
                # Check if verified account already exists
                cur.execute("SELECT id, is_verified FROM users WHERE email = %s", (clean_email,))
                existing = cur.fetchone()
                if existing and existing["is_verified"]:
                    return {"success": False, "error": "An account with this email already exists. Please log in."}

                # Check resend cooldown
                cur.execute(
                    """
                    SELECT last_sent_at FROM otp_verifications 
                    WHERE email = %s 
                    ORDER BY id DESC LIMIT 1
                    """,
                    (clean_email,)
                )
                last_otp = cur.fetchone()
                if last_otp and last_otp["last_sent_at"]:
                    last_time = last_otp["last_sent_at"]
                    if hasattr(last_time, "timestamp"):
                        elapsed = (now - last_time).total_seconds()
                    else:
                        elapsed = 999
                    if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
                        remaining = int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)
                        return {
                            "success": False,
                            "error": f"Please wait {remaining} seconds before requesting a new code.",
                            "cooldown_remaining": remaining
                        }

                # Insert or update pending unverified user
                if existing:
                    cur.execute(
                        """
                        UPDATE users 
                        SET full_name = %s, password_hash = %s, is_verified = FALSE 
                        WHERE email = %s
                        """,
                        (clean_name, pwd_hash, clean_email)
                    )
                else:
                    cur.execute(
                        """
                        INSERT INTO users (full_name, email, password_hash, is_verified) 
                        VALUES (%s, %s, %s, FALSE)
                        """,
                        (clean_name, clean_email, pwd_hash)
                    )

                # Invalidate previous OTPs
                cur.execute("UPDATE otp_verifications SET is_used = TRUE WHERE email = %s", (clean_email,))

                cur.execute(
                    """
                    INSERT INTO otp_verifications (email, otp_hash, attempts, max_attempts, is_used, expires_at, last_sent_at)
                    VALUES (%s, %s, 0, %s, FALSE, %s, %s)
                    """,
                    (clean_email, hashed_otp, OTP_MAX_ATTEMPTS, expires_at, now)
                )
        except Exception as e:
            logger.warning(f"PostgreSQL failed during registration ({e}), using SQLite fallback.")
            return _register_pending_user_sqlite(clean_name, clean_email, pwd_hash, hashed_otp, plain_otp, now, expires_at)
    else:
        return _register_pending_user_sqlite(clean_name, clean_email, pwd_hash, hashed_otp, plain_otp, now, expires_at)

    # Dispatch real email
    sent, reason = send_real_email_otp(clean_email, clean_name, plain_otp)
    if not sent:
        return {
            "success": True,
            "message": "Verification code generated.",
            "email": clean_email,
            "dev_otp": plain_otp,
            "smtp_notice": f"SMTP not configured ({reason}). Using dev OTP mode.",
            "cooldown_seconds": OTP_RESEND_COOLDOWN_SECONDS
        }

    return {
        "success": True,
        "message": "Verification code sent to your email address.",
        "email": clean_email,
        "cooldown_seconds": OTP_RESEND_COOLDOWN_SECONDS
    }

def _register_pending_user_sqlite(clean_name, clean_email, pwd_hash, hashed_otp, plain_otp, now, expires_at):
    conn = get_sqlite_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, is_verified FROM users WHERE email = ?", (clean_email,))
        existing = cur.fetchone()
        if existing and existing["is_verified"]:
            return {"success": False, "error": "An account with this email already exists. Please log in."}

        cur.execute("SELECT last_sent_at FROM otp_verifications WHERE email = ? ORDER BY id DESC LIMIT 1", (clean_email,))
        last_otp = cur.fetchone()
        if last_otp and last_otp["last_sent_at"]:
            try:
                last_time = datetime.fromisoformat(last_otp["last_sent_at"])
                elapsed = (now - last_time).total_seconds()
                if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
                    remaining = int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)
                    return {
                        "success": False,
                        "error": f"Please wait {remaining} seconds before requesting a new code.",
                        "cooldown_remaining": remaining
                    }
            except Exception:
                pass

        if existing:
            cur.execute("UPDATE users SET full_name = ?, password_hash = ?, is_verified = 0 WHERE email = ?", (clean_name, pwd_hash, clean_email))
        else:
            cur.execute("INSERT INTO users (full_name, email, password_hash, is_verified) VALUES (?, ?, ?, 0)", (clean_name, clean_email, pwd_hash))

        cur.execute("UPDATE otp_verifications SET is_used = 1 WHERE email = ?", (clean_email,))
        cur.execute(
            "INSERT INTO otp_verifications (email, otp_hash, attempts, max_attempts, is_used, expires_at, last_sent_at) VALUES (?, ?, 0, ?, 0, ?, ?)",
            (clean_email, hashed_otp, OTP_MAX_ATTEMPTS, expires_at.isoformat(), now.isoformat())
        )
        conn.commit()
    finally:
        conn.close()

    sent, reason = send_real_email_otp(clean_email, clean_name, plain_otp)
    if not sent:
        return {
            "success": True,
            "message": "Verification code generated.",
            "email": clean_email,
            "dev_otp": plain_otp,
            "smtp_notice": f"SMTP not configured ({reason}). Using dev OTP mode.",
            "cooldown_seconds": OTP_RESEND_COOLDOWN_SECONDS
        }

    return {
        "success": True,
        "message": "Verification code sent to your email address.",
        "email": clean_email,
        "cooldown_seconds": OTP_RESEND_COOLDOWN_SECONDS
    }

def resend_otp(email: str) -> Dict[str, Any]:
    clean_email = email.strip().lower()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)
    plain_otp = generate_secure_otp()
    hashed_otp = hash_otp(plain_otp)

    if is_postgres_available():
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute("SELECT id, full_name, is_verified FROM users WHERE email = %s", (clean_email,))
                user = cur.fetchone()
                if not user:
                    return {"success": False, "error": "No registration found for this email."}
                if user["is_verified"]:
                    return {"success": False, "error": "This account is already verified. You can log in directly."}

                # Check cooldown
                cur.execute("SELECT last_sent_at FROM otp_verifications WHERE email = %s ORDER BY id DESC LIMIT 1", (clean_email,))
                last_otp = cur.fetchone()
                if last_otp and last_otp["last_sent_at"]:
                    last_time = last_otp["last_sent_at"]
                    elapsed = (now - last_time).total_seconds() if hasattr(last_time, "timestamp") else 999
                    if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
                        remaining = int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)
                        return {
                            "success": False,
                            "error": f"Please wait {remaining} seconds before requesting a new code.",
                            "cooldown_remaining": remaining
                        }

                # Invalidate previous
                cur.execute("UPDATE otp_verifications SET is_used = TRUE WHERE email = %s", (clean_email,))
                cur.execute(
                    """
                    INSERT INTO otp_verifications (email, otp_hash, attempts, max_attempts, is_used, expires_at, last_sent_at)
                    VALUES (%s, %s, 0, %s, FALSE, %s, %s)
                    """,
                    (clean_email, hashed_otp, OTP_MAX_ATTEMPTS, expires_at, now)
                )
                user_name = user["full_name"]
        except Exception:
            return _resend_otp_sqlite(clean_email, plain_otp, hashed_otp, now, expires_at)
    else:
        return _resend_otp_sqlite(clean_email, plain_otp, hashed_otp, now, expires_at)

    sent, reason = send_real_email_otp(clean_email, user_name, plain_otp)
    return {
        "success": True,
        "message": "A new verification code has been generated.",
        "dev_otp": plain_otp if not sent else None
    }

def _resend_otp_sqlite(clean_email, plain_otp, hashed_otp, now, expires_at):
    conn = get_sqlite_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, full_name, is_verified FROM users WHERE email = ?", (clean_email,))
        user = cur.fetchone()
        if not user:
            return {"success": False, "error": "No registration found for this email."}
        if user["is_verified"]:
            return {"success": False, "error": "This account is already verified. You can log in directly."}

        cur.execute("SELECT last_sent_at FROM otp_verifications WHERE email = ? ORDER BY id DESC LIMIT 1", (clean_email,))
        last_otp = cur.fetchone()
        if last_otp and last_otp["last_sent_at"]:
            try:
                last_time = datetime.fromisoformat(last_otp["last_sent_at"])
                elapsed = (now - last_time).total_seconds()
                if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
                    remaining = int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)
                    return {
                        "success": False,
                        "error": f"Please wait {remaining} seconds before requesting a new code.",
                        "cooldown_remaining": remaining
                    }
            except Exception:
                pass

        cur.execute("UPDATE otp_verifications SET is_used = 1 WHERE email = ?", (clean_email,))
        cur.execute(
            "INSERT INTO otp_verifications (email, otp_hash, attempts, max_attempts, is_used, expires_at, last_sent_at) VALUES (?, ?, 0, ?, 0, ?, ?)",
            (clean_email, hashed_otp, OTP_MAX_ATTEMPTS, expires_at.isoformat(), now.isoformat())
        )
        conn.commit()
        user_name = user["full_name"]
    finally:
        conn.close()

    sent, reason = send_real_email_otp(clean_email, user_name, plain_otp)
    return {
        "success": True,
        "message": "A new verification code has been generated.",
        "dev_otp": plain_otp if not sent else None
    }

def verify_email_otp(email: str, entered_otp: str) -> Dict[str, Any]:
    """
    Verifies 6-digit OTP against backend cryptographic hash.
    Enforces expiry (5 min), single use, max 5 attempts.
    Marks user as verified upon success.
    """
    clean_email = email.strip().lower()
    code = entered_otp.strip()
    now = datetime.now(timezone.utc)

    if not code or len(code) != 6 or not code.isdigit():
        return {"success": False, "error": "Please enter a valid 6-digit numerical code."}

    hashed_input = hash_otp(code)

    if is_postgres_available():
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute(
                    """
                    SELECT id, otp_hash, attempts, max_attempts, is_used, expires_at 
                    FROM otp_verifications 
                    WHERE email = %s AND is_used = FALSE
                    ORDER BY id DESC LIMIT 1
                    """,
                    (clean_email,)
                )
                record = cur.fetchone()

                if not record:
                    return {"success": False, "error": "No active verification code found. Please request a new one."}

                if record["attempts"] >= record["max_attempts"]:
                    cur.execute("UPDATE otp_verifications SET is_used = TRUE WHERE id = %s", (record["id"],))
                    return {
                        "success": False,
                        "error": "Maximum verification attempts exceeded (5/5). This code has been invalidated. Please request a new code."
                    }

                if now > record["expires_at"]:
                    cur.execute("UPDATE otp_verifications SET is_used = TRUE WHERE id = %s", (record["id"],))
                    return {"success": False, "error": "This verification code has expired (valid for 5 minutes). Please request a new one."}

                if record["otp_hash"] != hashed_input:
                    new_attempts = record["attempts"] + 1
                    cur.execute("UPDATE otp_verifications SET attempts = %s WHERE id = %s", (new_attempts, record["id"]))
                    remaining = record["max_attempts"] - new_attempts
                    if remaining <= 0:
                        cur.execute("UPDATE otp_verifications SET is_used = TRUE WHERE id = %s", (record["id"],))
                        return {"success": False, "error": "Invalid code. Maximum attempts exceeded. Code invalidated."}
                    return {"success": False, "error": f"Invalid verification code. You have {remaining} attempts remaining."}

                cur.execute("UPDATE otp_verifications SET is_used = TRUE WHERE id = %s", (record["id"],))
                cur.execute(
                    """
                    UPDATE users 
                    SET is_verified = TRUE, verified_at = %s 
                    WHERE email = %s
                    RETURNING id, full_name, email
                    """,
                    (now, clean_email)
                )
                user_row = cur.fetchone()

                return {
                    "success": True,
                    "message": "Email verified successfully! Welcome to Unstuck.",
                    "user": user_row
                }
        except Exception:
            return _verify_email_otp_sqlite(clean_email, hashed_input, now)
    else:
        return _verify_email_otp_sqlite(clean_email, hashed_input, now)

def _verify_email_otp_sqlite(clean_email, hashed_input, now):
    conn = get_sqlite_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, otp_hash, attempts, max_attempts, is_used, expires_at FROM otp_verifications WHERE email = ? AND is_used = 0 ORDER BY id DESC LIMIT 1",
            (clean_email,)
        )
        record = cur.fetchone()
        if not record:
            return {"success": False, "error": "No active verification code found. Please request a new one."}

        if record["attempts"] >= record["max_attempts"]:
            cur.execute("UPDATE otp_verifications SET is_used = 1 WHERE id = ?", (record["id"],))
            conn.commit()
            return {"success": False, "error": "Maximum verification attempts exceeded (5/5). Code invalidated."}

        try:
            exp_time = datetime.fromisoformat(record["expires_at"])
            if now > exp_time:
                cur.execute("UPDATE otp_verifications SET is_used = 1 WHERE id = ?", (record["id"],))
                conn.commit()
                return {"success": False, "error": "This verification code has expired (valid for 5 minutes)."}
        except Exception:
            pass

        if record["otp_hash"] != hashed_input:
            new_attempts = record["attempts"] + 1
            cur.execute("UPDATE otp_verifications SET attempts = ? WHERE id = ?", (new_attempts, record["id"]))
            conn.commit()
            remaining = record["max_attempts"] - new_attempts
            if remaining <= 0:
                cur.execute("UPDATE otp_verifications SET is_used = 1 WHERE id = ?", (record["id"],))
                conn.commit()
                return {"success": False, "error": "Invalid code. Maximum attempts exceeded. Code invalidated."}
            return {"success": False, "error": f"Invalid verification code. You have {remaining} attempts remaining."}

        cur.execute("UPDATE otp_verifications SET is_used = 1 WHERE id = ?", (record["id"],))
        cur.execute(
            "UPDATE users SET is_verified = 1, verified_at = ? WHERE email = ?",
            (now.isoformat(), clean_email)
        )
        conn.commit()

        cur.execute("SELECT id, full_name, email FROM users WHERE email = ?", (clean_email,))
        u = cur.fetchone()
        user_row = {"id": u["id"], "name": u["full_name"], "full_name": u["full_name"], "email": u["email"]} if u else {"email": clean_email}

        return {
            "success": True,
            "message": "Email verified successfully! Welcome to Unstuck.",
            "user": user_row
        }
    finally:
        conn.close()

def authenticate_user(email: str, plain_password: str) -> Dict[str, Any]:
    clean_email = email.strip().lower()

    if is_postgres_available():
        try:
            with get_db_cursor(commit=False) as cur:
                cur.execute(
                    "SELECT id, full_name, email, password_hash, is_verified FROM users WHERE email = %s",
                    (clean_email,)
                )
                user = cur.fetchone()

                if not user:
                    return {"success": False, "error": "Invalid email or password."}

                if not verify_password(plain_password, user["password_hash"]):
                    return {"success": False, "error": "Invalid email or password."}

                if not user["is_verified"]:
                    return {
                        "success": False,
                        "error": "Your email address is not verified yet. Verification is required before logging in.",
                        "requires_verification": True,
                        "email": clean_email,
                        "full_name": user["full_name"]
                    }

                return {
                    "success": True,
                    "user": {
                        "id": user["id"],
                        "name": user["full_name"],
                        "full_name": user["full_name"],
                        "email": user["email"]
                    }
                }
        except Exception:
            return _authenticate_user_sqlite(clean_email, plain_password)
    else:
        return _authenticate_user_sqlite(clean_email, plain_password)

def _authenticate_user_sqlite(clean_email, plain_password):
    conn = get_sqlite_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, full_name, email, password_hash, is_verified FROM users WHERE email = ?", (clean_email,))
        user = cur.fetchone()
        if not user:
            return {"success": False, "error": "Invalid email or password."}

        if not verify_password(plain_password, user["password_hash"]):
            return {"success": False, "error": "Invalid email or password."}

        if not user["is_verified"]:
            return {
                "success": False,
                "error": "Your email address is not verified yet. Verification is required before logging in.",
                "requires_verification": True,
                "email": clean_email,
                "full_name": user["full_name"]
            }

        return {
            "success": True,
            "user": {
                "id": user["id"],
                "name": user["full_name"],
                "full_name": user["full_name"],
                "email": user["email"]
            }
        }
    finally:
        conn.close()
