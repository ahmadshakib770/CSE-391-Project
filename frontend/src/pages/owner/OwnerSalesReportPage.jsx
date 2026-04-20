import { useEffect, useState } from "react";
import api from "../../api/client";

const formatStatus = (status) =>
  String(status || "")
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const formatOrderType = (orderType) =>
  String(orderType || "")
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const getOrderToken = (order) => {
  if (order?.orderToken) return order.orderToken;

  const fallbackToken = String(order?._id || "").slice(-6).toUpperCase();
  return fallbackToken || "N/A";
};

const formatDateTime = (dateValue) => {
  if (!dateValue) return "-";
  return new Date(dateValue).toLocaleString();
};

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const getProfitTrendLabel = (day) => {
  if (day.profitTrend === "no_previous") {
    return "No previous day to compare";
  }

  if (day.profitTrend === "increased") {
    return `Profit increased by ${formatCurrency(day.profitChangeFromPreviousDay)}`;
  }

  if (day.profitTrend === "decreased") {
    return `Profit decreased by ${formatCurrency(Math.abs(day.profitChangeFromPreviousDay))}`;
  }

  return "Profit unchanged from previous day";
};

const OwnerSalesReportPage = () => {
  const [currentDay, setCurrentDay] = useState(null);
  const [report, setReport] = useState(null);
  const [orders, setOrders] = useState([]);
  const [analyticsDays, setAnalyticsDays] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [form, setForm] = useState({ expenseAmount: "", expenseNotes: "" });
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      const [currentRes, latestRes] = await Promise.all([
        api.get("/owner/sales-report/current"),
        api.get("/owner/sales-report/latest")
      ]);

      setCurrentDay(currentRes.data.day || null);
      setReport(latestRes.data.report || null);
      setOrders(latestRes.data.orders || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sales report data");
      setSuccess("");
    }
  };

  const loadAnalytics = async () => {
    try {
      setIsAnalyticsLoading(true);
      const { data } = await api.get("/owner/sales-report/analytics");
      setAnalyticsDays(data.analyticsDays || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load analytics");
      setSuccess("");
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAnalytics = async () => {
    if (showAnalytics) {
      setShowAnalytics(false);
      return;
    }

    setShowAnalytics(true);
    await loadAnalytics();
  };

  const closeAndCount = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const expenseAmount = Number(form.expenseAmount || 0);

    if (Number.isNaN(expenseAmount) || expenseAmount < 0) {
      setError("Expense amount must be a valid non-negative number");
      return;
    }

    try {
      setIsClosing(true);
      const { data } = await api.post("/owner/sales-report/close", {
        expenseAmount,
        expenseNotes: form.expenseNotes
      });

      setReport(data.report || null);
      setOrders(data.orders || []);
      setForm({ expenseAmount: "", expenseNotes: "" });
      setSuccess("Day closed and counted successfully");

      const currentRes = await api.get("/owner/sales-report/current");
      setCurrentDay(currentRes.data.day || null);

      if (showAnalytics) {
        await loadAnalytics();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to close and count day");
      setSuccess("");
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <section className="page-section">
      <header className="section-header sales-header-row">
        <div>
          <p className="eyebrow">Finance Desk</p>
          <h2>Sales Report Dashboard</h2>
        </div>
        <button type="button" className="btn btn-secondary" onClick={openAnalytics} disabled={isAnalyticsLoading}>
          {isAnalyticsLoading ? "Analytics..." : "Analytics"}
        </button>
      </header>

      {showAnalytics ? (
        <article className="form sales-analytics-panel">
          <h3>Daily Analytics</h3>
          {isAnalyticsLoading ? (
            <p className="task-admin-text">Loading analytics...</p>
          ) : analyticsDays.length === 0 ? (
            <p className="task-admin-text">No closed day analytics yet.</p>
          ) : (
            <div className="sales-analytics-list">
              {analyticsDays.map((day) => (
                <article className="sales-analytics-row" key={day.reportId}>
                  <div className="sales-analytics-head">
                    <strong>Day #{day.dayNumber}</strong>
                    <span>{formatDateTime(day.periodStart)} - {formatDateTime(day.periodEnd)}</span>
                  </div>

                  <div className="sales-analytics-metrics">
                    <span>Revenue: {formatCurrency(day.revenue)}</span>
                    <span>Expenses: {formatCurrency(day.expenseAmount)}</span>
                    <span>Profit: {formatCurrency(day.profit)}</span>
                    <span>Orders: {Number(day.totalOrders || 0)}</span>
                  </div>

                  <p className={`sales-analytics-trend trend-${day.profitTrend}`}>{getProfitTrendLabel(day)}</p>
                </article>
              ))}
            </div>
          )}
        </article>
      ) : null}

      {currentDay ? (
        <article className="card sales-current-card">
          <h3>Current Open Day</h3>
          <p className="task-admin-text"><strong>Started:</strong> {formatDateTime(currentDay.periodStart)}</p>
          <p className="task-admin-text"><strong>Orders So Far:</strong> {currentDay.totalOrders}</p>
          <p className="task-admin-text"><strong>Revenue So Far:</strong> ${Number(currentDay.revenue || 0).toFixed(2)}</p>
        </article>
      ) : null}

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}

      <form onSubmit={closeAndCount} className="form">
        <h3>Close Day & Count</h3>
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="Total expenses for this day"
          value={form.expenseAmount}
          onChange={(e) => setForm((prev) => ({ ...prev, expenseAmount: e.target.value }))}
          required
        />
        <textarea
          placeholder="Expense notes (optional)"
          value={form.expenseNotes}
          onChange={(e) => setForm((prev) => ({ ...prev, expenseNotes: e.target.value }))}
        />
        <button type="submit" className="btn btn-primary" disabled={isClosing}>
          {isClosing ? "Closing..." : "Closed & Count"}
        </button>
      </form>

      {report ? (
        <>
          <div className="grid sales-kpi-grid">
            <article className="card sales-kpi-card">
              <h3>Revenue</h3>
              <p>${Number(report.revenue || 0).toFixed(2)}</p>
            </article>
            <article className="card sales-kpi-card">
              <h3>Expenses</h3>
              <p>${Number(report.expenseAmount || 0).toFixed(2)}</p>
            </article>
            <article className="card sales-kpi-card">
              <h3>Profit</h3>
              <p>${Number(report.profit || 0).toFixed(2)}</p>
            </article>
            <article className="card sales-kpi-card">
              <h3>Total Orders</h3>
              <p>{Number(report.totalOrders || 0)}</p>
            </article>
          </div>

          <article className="card sales-top-card">
            <h3>Top 3 Most Sold Items</h3>
            {report.topItems?.length ? (
              <ol className="sales-top-list">
                {report.topItems.map((item) => (
                  <li key={item.name} className="sales-top-item">
                    <span>{item.name}</span>
                    <span>x{item.quantity}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="task-admin-text">No sold items for this closed day.</p>
            )}
          </article>

          <article className="card sales-summary-card">
            <h3>Closed Day Window</h3>
            <p className="task-admin-text"><strong>From:</strong> {formatDateTime(report.periodStart)}</p>
            <p className="task-admin-text"><strong>To:</strong> {formatDateTime(report.periodEnd)}</p>
          </article>

          <section className="page-section">
            <header className="section-header">
              <p className="eyebrow">Order Snapshot</p>
              <h3>Orders For Closed Day</h3>
            </header>

            <div className="form order-list-panel">
              {orders.length === 0 ? (
                <p className="menu-placeholder">No orders in this closed day.</p>
              ) : (
                <div className="order-cards">
                  {orders.map((order) => (
                    <article className="order-card" key={order._id}>
                      <header className="order-card-head">
                        <div className="order-card-title-wrap">
                          <h3 className="order-card-name" title={order.customerName || "Walk-in"}>
                            {order.customerName || "Walk-in"}
                          </h3>
                          <p className="order-card-token">Token #{getOrderToken(order)}</p>
                        </div>
                        <span className={`status-pill status-${order.status}`}>{formatStatus(order.status)}</span>
                      </header>

                      <div className="order-card-meta">
                        <span>{formatOrderType(order.orderType)}</span>
                        <span>{order.tableNumber ? `Table ${order.tableNumber}` : "No Table"}</span>
                      </div>

                      <div className="order-card-meta">
                        <span>Payment: {order.paymentMethod === "digital" ? "Digital (Stripe)" : "Cash"}</span>
                        <span className={`status-pill status-payment-${order.paymentStatus}`}>
                          {formatStatus(order.paymentStatus)}
                        </span>
                      </div>

                      <div className="order-card-items">
                        {(order.items || []).map((item, idx) => (
                          <div className="order-card-item-row" key={`${order._id}-${idx}`}>
                            <span className="order-card-item-name" title={item.name}>{item.name}</span>
                            <span className="order-card-item-qty">x{item.quantity}</span>
                            <span className="order-card-item-price">
                              ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <footer className="order-card-footer">
                        <span><strong>Total:</strong> ${Number(order.totalAmount || 0).toFixed(2)}</span>
                      </footer>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        <p className="menu-placeholder">No closed report yet. Click Closed & Count to generate one.</p>
      )}
    </section>
  );
};

export default OwnerSalesReportPage;
