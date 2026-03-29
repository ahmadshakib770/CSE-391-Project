import { useState } from "react";
import api from "../../api/client";

const StaffOrdersPage = () => {
  const [orderType, setOrderType] = useState("table_service");
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [items, setItems] = useState([{ name: "", quantity: 1 }]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { name: "", quantity: 1 }]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const payload = {
        orderType,
        customerName,
        tableNumber,
        items: items.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity),
          price: 0
        }))
      };
      const { data } = await api.post("/staff/orders", payload);
      setMessage(`Order created. Total bill: ${data.order.totalAmount}`);
      setCustomerName("");
      setTableNumber("");
      setItems([{ name: "", quantity: 1 }]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create order");
    }
  };

  return (
    <section>
      <p className="eyebrow">Order Desk</p>
      <h2>Create Order</h2>
      <form onSubmit={submit} className="form">
        <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
          <option value="table_service">Table Service</option>
          <option value="cashier">Cashier</option>
          <option value="drive_thru">Drive-Thru</option>
        </select>
        <input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        <input placeholder="Table number (optional)" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />

        {items.map((item, idx) => (
          <div className="row" key={`item-${idx}`}>
            <input placeholder="Item name" value={item.name} onChange={(e) => updateItem(idx, "name", e.target.value)} required />
            <input placeholder="Item count" type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} required />
          </div>
        ))}
        <button type="button" onClick={addItem}>Add Item</button>
        <button type="submit">Create Order</button>
      </form>
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
};

export default StaffOrdersPage;
