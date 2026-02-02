import { useState } from "react";
import {
  AreaChart, Area,
  XAxis, YAxis,
  Tooltip, CartesianGrid,
  BarChart, Bar
} from "recharts";

import "./index.css";

export default function App() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [lang, setLang] = useState("en");

  const upload = async () => {
    if (!file) return alert("Please upload a file");

    const f = new FormData();
    f.append("file", file);

    const r = await fetch(`http://127.0.0.1:8000/analyze?lang=${lang}`, {
      method: "POST",
      body: f
    });

    setData(await r.json());
  };

  return (
    <div className="container">

      {/* ===== HEADER ===== */}
      <div className="header">
        <h1>Financial Health Dashboard</h1>
        <p>Business performance & risk analysis</p>
      </div>

      {/* ===== ACTION BAR ===== */}
      <div className="card action-bar">
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <button onClick={upload}>Analyze Report</button>

        <div className="lang-switch">
          <button onClick={() => setLang("en")}>EN</button>
          <button onClick={() => setLang("hi")}>हिंदी</button>
        </div>
      </div>

      {data && (
        <>

        {/* ===== SUMMARY GRID ===== */}
        <div className="grid">
          <div className="card">
            <h3>Revenue</h3>
            <p className="metric">₹{data.revenue}</p>
          </div>

          <div className="card">
            <h3>Expense</h3>
            <p className="metric">₹{data.expense}</p>
          </div>

          <div className="card">
            <h3>Profit</h3>
            <p className="metric">₹{data.profit}</p>
          </div>

          <div className="card">
            <h3>Health Score</h3>
            <span className="badge good">{data.health_score}/100</span>
          </div>
        </div>

        {/* ===== CREDIT SCORE ===== */}
        <div className="card">
          <h2>Credit Score</h2>
          <div className="progress">
            <div
              className="progress-fill"
              style={{ width: `${data.credit_score}%` }}
            >
              {data.credit_score}/100
            </div>
          </div>
        </div>

        {/* ===== FORECAST ===== */}
        <div className="card">
          <h2>Forecast & Benchmark</h2>
          <p><b>Next Month Revenue:</b> ₹{data.forecast}</p>
          <p><b>Industry:</b> {data.industry} ({data.benchmark})</p>
        </div>

        {/* ===== RISK ===== */}
        <div className="card risk">
          <h2>Risk Level</h2>
          <b>{data.risk_level}</b>
        </div>

        {/* ===== AREA CHART ===== */}
        <div className="card">
          <h2>Revenue vs Expense</h2>
          <AreaChart width={900} height={300} data={data.chart_data}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date"/>
            <YAxis/>
            <Tooltip/>
            <Area type="monotone" dataKey="revenue" stroke="#2E7D32" fill="#A5D6A7"/>
            <Area type="monotone" dataKey="expense" stroke="#C62828" fill="#EF9A9A"/>
          </AreaChart>
        </div>

        {/* ===== EXPENSE CATEGORY ===== */}
        {data.expense_categories && (
          <div className="card">
            <h2>Expense Categories</h2>
            <BarChart
              width={700}
              height={300}
              data={Object.entries(data.expense_categories)
                .map(([k,v])=>({name:k,value:v}))}
            >
              <XAxis dataKey="name"/>
              <YAxis/>
              <Tooltip/>
              <Bar dataKey="value" fill="#1976D2"/>
            </BarChart>
          </div>
        )}

        {/* ===== AI INSIGHTS ===== */}
        <div className="card ai-box">
          <h2>AI Insights</h2>
          <p style={{ whiteSpace:"pre-line" }}>{data.ai_insights}</p>
        </div>

        {/* ===== EXPORT ===== */}
        <div className="card center">
          <button onClick={()=>fetch("http://127.0.0.1:8000/export")}>
            Export PDF Report
          </button>
        </div>

        </>
      )}
    </div>
  );
}
