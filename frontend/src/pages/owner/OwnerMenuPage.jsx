import { useEffect, useState } from "react";
import api from "../../api/client";

const initialForm = {
  name: "",
  category: "food",
  price: "",
  sortOrder: 0,
  isAvailable: true
};

const OwnerMenuPage = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [mode, setMode] = useState("add");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/owner/menu");
      setItems(data.items || []);
      setError("");
      setSuccess("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load menu");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await api.post("/owner/menu", {
        ...form,
        price: Number(form.price),
        sortOrder: Number(form.sortOrder)
      });
      setForm(initialForm);
      setSuccess("Menu item added successfully");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create menu item");
    }
  };

  const updateItem = async (item) => {
    try {
      await api.patch(`/owner/menu/${item._id}`, {
        name: item.name,
        category: item.category,
        price: Number(item.price),
        sortOrder: Number(item.sortOrder),
        isAvailable: Boolean(item.isAvailable)
      });
      setSuccess("Menu item updated successfully");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update menu item");
    }
  };

  const deleteItem = async (menuItemId) => {
    try {
      await api.delete(`/owner/menu/${menuItemId}`);
      setSelectedItemId("");
      setSuccess("Menu item deleted successfully");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete menu item");
    }
  };

  const selectedItem = items.find((item) => item._id === selectedItemId);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setSelectedItemId("");
    setForm(initialForm);
  };

  const selectItem = (item) => {
    setSelectedItemId(item._id);

    if (mode === "edit") {
      setForm({
        name: item.name,
        category: item.category,
        price: item.price,
        sortOrder: item.sortOrder,
        isAvailable: item.isAvailable
      });
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!selectedItemId) return;

    await updateItem({
      _id: selectedItemId,
      ...form,
      price: Number(form.price),
      sortOrder: Number(form.sortOrder)
    });
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItemId) return;
    await deleteItem(selectedItemId);
  };

  return (
    <section className="page-section">
      <header className="section-header">
        <p className="eyebrow">Admin Tools</p>
        <h2>Menu Management</h2>
      </header>

      <div className="menu-mode-bar">
        <button
          className={`btn ${mode === "edit" ? "btn-primary" : "btn-secondary"}`}
          type="button"
          onClick={() => switchMode("edit")}
        >
          Edit
        </button>
        <button
          className={`btn ${mode === "add" ? "btn-primary" : "btn-secondary"}`}
          type="button"
          onClick={() => switchMode("add")}
        >
          Add
        </button>
        <button
          className={`btn ${mode === "delete" ? "btn-primary" : "btn-secondary"}`}
          type="button"
          onClick={() => switchMode("delete")}
        >
          Delete
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}

      <div className="menu-layout">
        <section className="card menu-list-panel">
          <h3>All Menu Items</h3>
          <div className="menu-list">
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                className={`menu-list-item ${selectedItemId === item._id ? "selected" : ""}`}
                onClick={() => selectItem(item)}
              >
                <span className="menu-list-name" title={item.name}>{item.name}</span>
                <span className="menu-list-category" title={item.category}>{item.category}</span>
                <span className="menu-list-price">${Number(item.price).toFixed(2)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card menu-action-panel">
          {mode === "add" ? (
            <form onSubmit={handleCreate} className="form">
              <h3>Add Item</h3>
              <input
                placeholder="Item name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                <option value="food">Food</option>
                <option value="drink">Drink</option>
              </select>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
              <label>
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                />{" "}
                Available
              </label>
              <button type="submit" className="btn btn-primary">Add Item</button>
            </form>
          ) : null}

          {mode === "edit" ? (
            selectedItem ? (
              <form onSubmit={handleEditSubmit} className="form">
                <h3>Edit Item</h3>
                <input
                  placeholder="Item name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  <option value="food">Food</option>
                  <option value="drink">Drink</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Sort order"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  required
                />
                <label>
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                  />{" "}
                  Available
                </label>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </form>
            ) : (
              <div className="menu-placeholder">Select a menu item from the list to edit.</div>
            )
          ) : null}

          {mode === "delete" ? (
            selectedItem ? (
              <div className="form">
                <h3>Delete Item</h3>
                <p>Are you sure you want to delete <strong>{selectedItem.name}</strong>?</p>
                <button type="button" className="btn btn-primary" onClick={handleDeleteConfirm}>Delete Item</button>
              </div>
            ) : (
              <div className="menu-placeholder">Select a menu item from the list to delete.</div>
            )
          ) : null}
        </section>
      </div>
    </section>
  );
};

export default OwnerMenuPage;
