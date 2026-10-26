
"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const API = "http://127.0.0.1:8000";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [salesRows, setSalesRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartError, setChartError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      const token = localStorage.getItem("shopsense_token");
      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      try {
        const response = await fetch(
          `${API}/analytics/sales-summary`,
          { headers }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            typeof data.detail === "string"
              ? data.detail
              : "Could not load sales summary."
          );
        }

        setSummary(data);
      } catch (err) {
        setError(err.message || "Could not load analytics.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API}/transactions/`, {
          headers,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error("Could not load transaction history.");
        }

        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data.transactions)
          ? data.transactions
          : [];

        setSalesRows(
          rows.filter(
            (row) => row.payment_status === "completed"
          )
        );
      } catch (err) {
        setChartError(
          err.message || "Could not load sales trend."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const revenue = Number(summary?.total_revenue ?? 0);
  const orders = Number(summary?.total_transactions ?? 0);
  const unitsSold = Number(summary?.total_units_sold ?? 0);
  const averageOrderValue = orders ? revenue / orders : 0;

  const formatMoney = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: summary?.currency || "INR",
      maximumFractionDigits: 2,
    }).format(value);

  // Group actual completed transactions by date.
  const dailySales = {};

  salesRows.forEach((row) => {
    if (!row.created_at) return;

    const date = String(row.created_at).slice(0, 10);
    const amount = Number(
      row.total_amount ??
        Number(row.quantity || 0) *
          Number(row.unit_price || 0)
    );

    if (!Number.isFinite(amount)) return;

    dailySales[date] = (dailySales[date] || 0) + amount;
  });

  const dates = Object.keys(dailySales).sort();

  const chartData = {
    labels: dates.map((date) =>
      new Date(`${date}T00:00:00`).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        }
      )
    ),
    datasets: [
      {
        label: "Daily Revenue",
        data: dates.map((date) => dailySales[date]),
        borderColor: "#7048e8",
        backgroundColor: "rgba(112,72,232,0.13)",
        pointBackgroundColor: "#7048e8",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 5,
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) =>
            `Revenue: ${formatMoney(context.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#71809a" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#edf0f7" },
        ticks: {
          color: "#71809a",
          callback: (value) =>
            `₹${Number(value).toLocaleString("en-IN")}`,
        },
      },
    },
  };

  const metrics = [
    {
      label: "Total Revenue",
      value: formatMoney(revenue),
      icon: "₹",
      tone: "green",
      note: "Revenue from all transactions",
    },
    {
      label: "Total Orders",
      value: orders.toLocaleString("en-IN"),
      icon: "▣",
      tone: "blue",
      note: "Recorded transactions",
    },
    {
      label: "Units Sold",
      value: unitsSold.toLocaleString("en-IN"),
      icon: "▢",
      tone: "purple",
      note: "Total units sold",
    },
    {
      label: "Average Order Value",
      value: formatMoney(averageOrderValue),
      icon: "↗",
      tone: "yellow",
      note: "Revenue per transaction",
    },
  ];

  const insights = [
    {
      title: "Revenue",
      value: formatMoney(revenue),
      description: "Total recorded revenue",
      icon: "₹",
      tone: "green",
      progress: revenue > 0 ? 100 : 0,
    },
    {
      title: "Orders Completed",
      value: `${orders} ${orders === 1 ? "Order" : "Orders"}`,
      description: "Recorded transactions",
      icon: "▣",
      tone: "blue",
      progress: orders > 0 ? 100 : 0,
    },
    {
      title: "Units Sold",
      value: `${unitsSold} ${unitsSold === 1 ? "Unit" : "Units"}`,
      description: "Total units sold",
      icon: "▢",
      tone: "purple",
      progress: unitsSold > 0 ? 65 : 0,
    },
  ];

  return (
    <main className="page">
      <header className="header">
        <div>
          <p className="eyebrow">SHOPSENSE ANALYTICS</p>
          <h1>Sales Analytics Dashboard</h1>
          <p className="subtitle">
            Live sales insights from your FastAPI backend.
          </p>
        </div>

        <a className="back-button" href="/admin">
          ← Admin Dashboard
        </a>
      </header>

      {loading ? (
        <div className="state-card">
          Loading your sales analytics...
        </div>
      ) : error ? (
        <div className="state-card error">
          <h2>Unable to load analytics</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          <section className="metrics-grid">
            {metrics.map((metric) => (
              <article
                className={`metric-card ${metric.tone}`}
                key={metric.label}
              >
                <div className="metric-top">
                  <span className="metric-icon">
                    {metric.icon}
                  </span>
                  <span className="metric-label">
                    {metric.label}
                  </span>
                </div>

                <h2 className="metric-value">{metric.value}</h2>
                <p className="metric-note">{metric.note}</p>
              </article>
            ))}
          </section>

          <section className="panel">
            <div className="section-heading">
              <span className="chart-icon">↗</span>
              <div>
                <h2>Sales Trend</h2>
                <p>Daily revenue from completed transactions</p>
              </div>
            </div>

            {chartError ? (
              <p className="chart-message">{chartError}</p>
            ) : dates.length === 0 ? (
              <p className="chart-message">
                No completed transaction history is available yet.
              </p>
            ) : (
              <>
                <div className="chart-wrap">
                  <div className="chart-wrap">
  <Line
    data={chartData}
    options={chartOptions}
    fallbackContent="Sales chart could not be rendered."
  />
</div>
                </div>
                <p className="note">
                  Showing {dates.length} actual sales date(s).
                  Dates without transactions are not invented.
                </p>
              </>
            )}
          </section>

          <section className="panel">
            <div className="section-heading">
              <span className="chart-icon">▥</span>
              <div>
                <h2>Business Insights</h2>
                <p>Overview of recorded sales performance</p>
              </div>
            </div>

            <div className="insights-list">
              {insights.map((item) => (
                <article
                  className={`insight-row ${item.tone}`}
                  key={item.title}
                >
                  <span className="insight-icon">
                    {item.icon}
                  </span>

                  <div className="insight-content">
                    <div className="insight-details">
                      <div>
                        <h3>{item.title}</h3>
                        <p className="insight-value">
                          {item.value}
                        </p>
                      </div>
                      <p className="insight-description">
                        {item.description}
                      </p>
                    </div>

                    <div
                      className="progress-track"
                      role="progressbar"
                      aria-label={`${item.title} indicator`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={item.progress}
                    >
                      <div
                        className="progress-fill"
                        style={{
                          width: `${item.progress}%`,
                        }}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <p className="note">
              Summary cards use backend sales totals. Progress bars
              are visual indicators, not historical comparisons.
            </p>
          </section>
        </>
      )}

      <footer className="footer">
        ShopSense · Sales Analytics
      </footer>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          padding: 42px clamp(18px, 5vw, 64px);
          background: linear-gradient(145deg, #f8faff, #f3f5fb);
          color: #17233d;
          font-family: Arial, Helvetica, sans-serif;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
          margin-bottom: 36px;
        }

        .eyebrow {
          color: #6d4bea;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        h1 {
          margin: 0;
          font-size: clamp(27px, 3.5vw, 42px);
          color: #14213d;
        }

        .subtitle {
          color: #687795;
          line-height: 1.6;
        }

        .back-button {
          padding: 13px 20px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7955f5, #6240df);
          color: white;
          text-decoration: none;
          font-weight: 700;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        .metric-card {
          padding: 24px;
          border: 1px solid;
          border-radius: 16px;
          box-shadow: 0 5px 16px #27365b08;
          min-width: 0;
        }

        .green {
          --accent: #159b61;
          --accent-light: #27c783;
          --soft: #effbf5;
          --border: #ccefe0;
        }

        .blue {
          --accent: #245bc7;
          --accent-light: #4596ff;
          --soft: #f0f6ff;
          --border: #d4e4ff;
        }

        .purple {
          --accent: #6941dc;
          --accent-light: #895cf6;
          --soft: #f7f2ff;
          --border: #e6d9ff;
        }

        .yellow {
          --accent: #b77913;
          --accent-light: #e8a323;
          --soft: #fff9e9;
          --border: #f6e7bd;
        }

        .metric-card.green {
          background: #f2fcf7;
          border-color: #d3f1e2;
        }

        .metric-card.blue {
          background: #f3f7ff;
          border-color: #d9e5ff;
        }

        .metric-card.purple {
          background: #f8f4ff;
          border-color: #e8ddff;
        }

        .metric-card.yellow {
          background: #fffbf0;
          border-color: #f8e9c5;
        }

        .metric-top {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .metric-icon,
        .insight-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: var(--border);
          color: var(--accent);
          font-size: 24px;
          font-weight: 800;
        }

        .metric-label {
          color: #60708d;
          font-size: 14px;
          font-weight: 700;
        }

        .metric-value {
          margin: 20px 0 10px;
          color: var(--accent);
          font-size: clamp(21px, 2vw, 30px);
          overflow-wrap: anywhere;
        }

        .metric-note {
          color: #77849c;
          font-size: 12px;
        }

        .panel {
          margin-top: 30px;
          padding: 28px;
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 18px;
          box-shadow: 0 8px 24px #27365b0a;
        }

        .section-heading {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }

        .chart-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #f0eaff;
          color: #7048e8;
          font-size: 26px;
          font-weight: 800;
        }

        .section-heading h2 {
          margin: 0;
          font-size: 23px;
        }

        .section-heading p {
          margin: 6px 0 0;
          color: #77849c;
          font-size: 13px;
        }

        .chart-wrap {
          position: relative;
          width: 100%;
          height: 300px;
        }

        .chart-message {
          padding: 18px;
          border-radius: 12px;
          background: #f7f8fc;
          color: #687795;
          line-height: 1.6;
        }

        .insights-list {
          display: grid;
          gap: 14px;
        }

        .insight-row {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          padding: 20px;
          border-radius: 14px;
          background: var(--soft);
        }

        .insight-content {
          flex: 1;
          min-width: 0;
        }

        .insight-details {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .insight-details h3 {
          margin: 2px 0 7px;
          color: #5d6d89;
          font-size: 14px;
        }

        .insight-value {
          margin: 0;
          color: var(--accent);
          font-size: 24px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .insight-description {
          color: #71809a;
          font-size: 13px;
          text-align: right;
        }

        .progress-track {
          height: 10px;
          margin-top: 16px;
          overflow: hidden;
          border-radius: 999px;
          background: #dfe6f1;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            var(--accent-light),
            var(--accent)
          );
          transition: width 0.5s ease;
        }

        .note {
          margin-top: 18px;
          color: #7b879d;
          font-size: 12px;
          line-height: 1.6;
        }

        .state-card {
          padding: 28px;
          background: white;
          border: 1px solid #e1e7f0;
          border-radius: 16px;
        }

        .error {
          color: #b42318;
          background: #fff6f5;
          border-color: #f5d1ce;
        }

        button {
          padding: 10px 16px;
          border: 0;
          border-radius: 8px;
          background: #6d4bea;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .footer {
          padding-top: 28px;
          color: #8a95a8;
          font-size: 12px;
          text-align: center;
        }

        @media (max-width: 1050px) {
          .metrics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .page {
            padding: 24px 16px;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .panel {
            padding: 18px;
          }

          .chart-wrap {
            height: 240px;
          }

          .insight-details {
            display: block;
          }

          .insight-description {
            text-align: left;
          }
        }
      `}</style>
    </main>
  );
}
