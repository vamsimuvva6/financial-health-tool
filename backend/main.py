from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import uuid
import os

from report_generator import create_report
from financial_engine import compute_metrics
from risk_engine import detect_risks
from ai_insights import generate_ai_insights
from auto_insights import auto_generate_insights


# =============================
# APP SETUP
# =============================
app = FastAPI(title="Financial Health Assessment Tool")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================
# IN-MEMORY RESULT STORE
# =============================
# NOTE: replace with Redis/DB in full production
RESULT_STORE = {}

REPORT_DIR = "reports"
os.makedirs(REPORT_DIR, exist_ok=True)


# =============================
# HOME
# =============================
@app.get("/")
def home():
    return {"message": "Backend running successfully 🚀"}


# =============================
# ANALYZE CSV
# =============================
@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    try:
        df = pd.read_csv(file.file)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV file")

    required_cols = {"date", "revenue", "expense"}
    if not required_cols.issubset(df.columns):
        raise HTTPException(
            status_code=400,
            detail="CSV must contain date, revenue, expense columns"
        )

    # 1️⃣ Financial Metrics
    result = compute_metrics(df)

    # 2️⃣ Chart Data
    result["chart_data"] = df[["date", "revenue", "expense"]].to_dict(
        orient="records"
    )

    # 3️⃣ Risk Detection
    result["risks"] = detect_risks(result)

    # 4️⃣ AI Insights
    ai_text = generate_ai_insights(result)
    if not ai_text:
        ai_text = auto_generate_insights(result)

    result["ai_insights"] = ai_text

    # 5️⃣ Generate Report ID
    report_id = str(uuid.uuid4())
    RESULT_STORE[report_id] = result

    return {
        "report_id": report_id,
        "data": result
    }


# =============================
# EXPORT PDF
# =============================
@app.get("/export/{report_id}")
def export_report(report_id: str):

    if report_id not in RESULT_STORE:
        raise HTTPException(
            status_code=404,
            detail="Invalid report_id or analysis expired"
        )

    result = RESULT_STORE[report_id]

    pdf_path = create_report(
        result,
        output_dir=REPORT_DIR,
        filename=f"{report_id}.pdf"
    )

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename="financial_report.pdf",
        headers={
            "Content-Disposition": "attachment; filename=financial_report.pdf"
        }
    )
