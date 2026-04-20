import { MenuItem } from "../models/MenuItem.js";

export const getMenuItems = async (_req, res, next) => {
  try {
    const items = await MenuItem.find().sort({ category: 1, sortOrder: 1, createdAt: -1 });
    res.json({ items });
  } catch (error) {
    next(error);
  }
};

export const createMenuItem = async (req, res, next) => {
  try {
    const { name, category, price, isAvailable, sortOrder } = req.body;

    const item = await MenuItem.create({
      name,
      category,
      price,
      isAvailable: Boolean(isAvailable),
      sortOrder: Number(sortOrder || 0),
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    res.status(201).json({ item });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Menu item already exists in this category" });
    }

    next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;
    const { name, category, price, isAvailable, sortOrder } = req.body;

    const item = await MenuItem.findByIdAndUpdate(
      menuItemId,
      {
        name,
        category,
        price,
        isAvailable,
        sortOrder,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json({ item });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Menu item already exists in this category" });
    }

    next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;
    const item = await MenuItem.findByIdAndDelete(menuItemId);

    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json({ message: "Menu item deleted" });
  } catch (error) {
    next(error);
  }
};
