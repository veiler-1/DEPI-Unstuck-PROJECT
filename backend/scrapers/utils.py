import re
from datetime import datetime, timedelta


def get_local_utc_offset() -> timedelta:
    offset = datetime.now().astimezone().utcoffset()
    return offset if offset is not None else timedelta(hours=3)


def convert_utc_to_local(utc_str: str) -> str:
    if not utc_str:
        return ""
    try:
        dt = datetime.strptime(utc_str.strip()[:19], "%Y-%m-%d %H:%M:%S")
        return (dt + get_local_utc_offset()).strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return utc_str


def parse_arabic_relative_time(text: str, now: datetime = None) -> str:
    if not text:
        return ""
    now = now or datetime.now()
    t = re.sub(r"^\s*منذ\s*", "", text.strip())
    total = 0

    sec = re.search(r"(\d+)\s*(?:ثانية|ثواني|ثوانٍ)", t)
    if sec:
        total += int(sec.group(1))
    elif "لحظات" in t:
        total += 30

    m = re.search(r"(\d+)\s*(?:دقيقة|دقائق)", t)
    if m:
        total += int(m.group(1)) * 60
    elif "دقيقتين" in t:
        total += 120
    elif "دقيقة" in t:
        total += 60

    h = re.search(r"(\d+)\s*(?:ساعة|ساعات)", t)
    if h:
        total += int(h.group(1)) * 3600
    elif "ساعتين" in t:
        total += 7200
    elif "ساعة" in t:
        total += 3600

    d = re.search(r"(\d+)\s*(?:يوم|أيام|ايام)", t)
    if d:
        total += int(d.group(1)) * 86400
    elif "يومين" in t:
        total += 172800
    elif "يوم" in t:
        total += 86400

    w = re.search(r"(\d+)\s*(?:أسبوع|أسابيع|اسبوع)", t)
    if w:
        total += int(w.group(1)) * 604800
    elif "أسبوعين" in t or "اسبوعين" in t:
        total += 1209600
    elif "أسبوع" in t or "اسبوع" in t:
        total += 604800

    mo = re.search(r"(\d+)\s*(?:شهر|أشهر|اشهر)", t)
    if mo:
        total += int(mo.group(1)) * 2592000
    elif "شهرين" in t:
        total += 5184000
    elif "شهر" in t:
        total += 2592000

    return (now - timedelta(seconds=total)).strftime("%Y-%m-%d %H:%M:%S")
