import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";

const StaffOrdersPage = () => {
  const [orderType, setOrderType] = useState("table_service");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const menuRes = await api.get("/staff/menu");
      setMenuItems(menuRes.data.items || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load order data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setItemQuantity = (menuItem, quantityValue) => {
    const quantity = Number(quantityValue || 0);

    setSelectedItems((prev) => {
      const next = { ...prev };

      if (quantity <= 0) {
        delete next[menuItem._id];
        return next;
      }

      next[menuItem._id] = {
        name: menuItem.name,
        price: Number(menuItem.price),
        quantity
      };

      return next;
    });
  };

  const selectedItemsList = useMemo(() => Object.values(selectedItems), [selectedItems]);

  const currentTotal = useMemo(
    () =>
      selectedItemsList.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0),
    [selectedItemsList]
  );

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!customerName.trim()) {
      setError("Customer name is required");
      return;
    }

    if (selectedItemsList.length === 0) {
      setError("Select at least one menu item with quantity");
      return;
    }

    try {
      const payload = {
        orderType,
        paymentMethod,
        customerName: customerName.trim(),
        tableNumber,
        items: selectedItemsList.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity),
          price: Number(item.price)
        }))
      };
      const { data } = await api.post("/staff/orders", payload);

      if (paymentMethod === "digital") {
        const checkoutRes = await api.post(`/staff/orders/${data.order._id}/checkout-session`);
        const checkoutUrl = checkoutRes.data?.url;

        if (!checkoutUrl) {
          setError("Order created, but failed to start Stripe checkout");
          return;
        }

        window.location.href = checkoutUrl;
        return;
      }

      const tokenText = data.order?.orderToken ? `Token #${data.order.orderToken} created. ` : "Order created. ";
      setMessage(`${tokenText}Cash payment recorded. Total bill: ${data.order.totalAmount}`);
      setPaymentMethod("cash");
      setCustomerName("");
      setTableNumber("");
      setSelectedItems({});
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create order");
    }
  };

  return (
    <section className="page-section">
      <header className="section-header">
        <p className="eyebrow">Order Desk</p>
        <h2>Create Order</h2>
      </header>
      <form onSubmit={submit} className="form">
        <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
          <option value="table_service">Table Service</option>
          <option value="cashier">Cashier</option>
          <option value="drive_thru">Drive-Thru</option>
        </select>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="cash">Pay by Cash</option>
          <option value="digital">Pay Digitally (Stripe)</option>
        </select>
        <input
          placeholder="Customer name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />
        <input placeholder="Table number (optional)" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />

        <div className="menu-pick-grid">
          {menuItems.map((menuItem) => (
            <article className="menu-pick-card" key={menuItem._id}>
              <h4 className="menu-pick-name" title={menuItem.name}>{menuItem.name}</h4>
              <p className="menu-pick-category">{menuItem.category}</p>
              <p className="menu-pick-price">${Number(menuItem.price).toFixed(2)}</p>
              <input
                type="number"
                min={0}
                placeholder="Qty"
                value={selectedItems[menuItem._id]?.quantity ?? ""}
                onChange={(e) => setItemQuantity(menuItem, e.target.value)}
              />
            </article>
          ))}
        </div>

        <div className="order-summary-line"><strong>Total:</strong> ${currentTotal.toFixed(2)}</div>
        <button type="submit" className="btn btn-primary">
          {paymentMethod === "digital" ? "Create Order & Pay with Stripe" : "Create Order"}
        </button>
      </form>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
};

export default StaffOrdersPage;
