import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";

const ORDER_STATUS_STAGES = ["pending", "preparing", "ready", "completed"];

const formatOrderType = (orderType) =>
  String(orderType || "")
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const formatStatus = (status) =>
  String(status || "")
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const getNextOrderStatus = (currentStatus) => {
  const currentIndex = ORDER_STATUS_STAGES.indexOf(currentStatus);
  if (currentIndex === -1) return null;
  return ORDER_STATUS_STAGES[currentIndex + 1] || null;
};

const getOrderToken = (order) => {
  if (order?.orderToken) return order.orderToken;

  const fallbackToken = String(order?._id || "").slice(-6).toUpperCase();
  return fallbackToken || "N/A";
};

const normalizeText = (value) => String(value || "").toLowerCase().trim();

const OwnerOrderTrackingPage = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [previousDayOrderCount, setPreviousDayOrderCount] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [isDeletingPreviousDay, setIsDeletingPreviousDay] = useState(false);

  const filteredOrders = useMemo(() => {
    const query = normalizeText(searchTerm);
    if (!query) return orders;

    return orders.filter((order) => {
      const token = normalizeText(getOrderToken(order));
      const customerName = normalizeText(order.customerName);
      return token.includes(query) || customerName.includes(query);
    });
  }, [orders, searchTerm]);

  const loadOrders = async () => {
    try {
      const { data } = await api.get("/owner/orders");
      setOrders(data.orders || []);
      setPreviousDayOrderCount(Number(data.previousDayOrderCount || 0));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
      setSuccess("");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const deletePreviousDay = async () => {
    try {
      setIsDeletingPreviousDay(true);
      const { data } = await api.delete("/owner/orders/previous-day");
      setSuccess(`Deleted ${Number(data.deletedCount || 0)} previous-day orders.`);
      setError("");
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete previous-day orders");
      setSuccess("");
    } finally {
      setIsDeletingPreviousDay(false);
    }
  };

  const moveOrderToNextStage = async (order) => {
    const nextStatus = getNextOrderStatus(order.status);
    if (!nextStatus) return;

    try {
      setUpdatingOrderId(order._id);
      const { data } = await api.patch(`/owner/orders/${order._id}/status`, { status: nextStatus });

      setOrders((prev) =>
        prev.map((item) =>
          item._id === order._id
            ? { ...item, ...data.order, isPreviousDay: item.isPreviousDay }
            : item
        )
      );
      setError("");
      setSuccess(`Order token #${getOrderToken(order)} moved to ${formatStatus(nextStatus)}.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order status");
      setSuccess("");
    } finally {
      setUpdatingOrderId("");
    }
  };

  return (
    <section className="page-section">
      <header className="section-header">
        <div>
          <p className="eyebrow">Order Status</p>
          <h2>Order Tracking</h2>
        </div>
      </header>

      <div className="row search-toolbar">
        <input
          className="search-input"
          placeholder="Search by token or customer name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="row">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={deletePreviousDay}
          disabled={isDeletingPreviousDay || previousDayOrderCount === 0}
        >
          {isDeletingPreviousDay
            ? "Deleting..."
            : `Delete Previous Day Orders (${previousDayOrderCount})`}
        </button>
      </div>

      {success ? <p className="success">{success}</p> : null}

      <div className="form order-list-panel">
        {orders.length === 0 ? (
          <p className="menu-placeholder">No orders found.</p>
        ) : filteredOrders.length === 0 ? (
          <p className="menu-placeholder">No orders matched your search.</p>
        ) : (
          <div className="order-cards">
            {filteredOrders.map((order) => (
              <article
                className={`order-card${order.isPreviousDay ? " order-card-previous-day" : ""}`}
                key={order._id}
              >
                <header className="order-card-head">
                  <div className="order-card-title-wrap">
                    <h3 className="order-card-name" title={order.customerName || "Walk-in"}>
                      {order.customerName || "Walk-in"}
                    </h3>
                    <p className="order-card-token">Token #{getOrderToken(order)}</p>
                    {order.isPreviousDay ? <p className="order-previous-flag">Previous Day</p> : null}
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
                  {getNextOrderStatus(order.status) ? (
                    <button
                      type="button"
                      className="btn btn-secondary order-status-btn"
                      onClick={() => moveOrderToNextStage(order)}
                      disabled={updatingOrderId === order._id}
                    >
                      {updatingOrderId === order._id
                        ? "Updating..."
                        : `Mark as ${formatStatus(getNextOrderStatus(order.status))}`}
                    </button>
                  ) : (
                    <span className="order-status-done">Completed</span>
                  )}
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>

      {error ? <p className="error">{error}</p> : null}
    </section>
  );
};

export default OwnerOrderTrackingPage;
