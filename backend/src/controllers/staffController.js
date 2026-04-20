import Stripe from "stripe";
import { env } from "../config/env.js";
import { Order } from "../models/Order.js";
import { Task } from "../models/Task.js";
import { MenuItem } from "../models/MenuItem.js";

const ORDER_STATUS_STAGES = ["pending", "preparing", "ready", "completed"];
const PAYMENT_METHODS = ["cash", "digital"];
const STRIPE_PAYMENT_STATUS_MAP = {
  requires_payment_method: "unpaid",
  requires_confirmation: "unpaid",
  requires_action: "unpaid",
  processing: "processing",
  requires_capture: "processing",
  succeeded: "paid",
  canceled: "failed"
};

const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;

const generateOrderToken = () => String(Math.floor(100000 + Math.random() * 900000));

const toMinorAmount = (amount) => Math.round(Number(amount || 0) * 100);

const mapStripeStatusToPaymentStatus = (stripeStatus) =>
  STRIPE_PAYMENT_STATUS_MAP[stripeStatus] || "unpaid";

const mapCheckoutSessionStatusToPaymentStatus = (session) => {
  if (session?.payment_status === "paid") return "paid";
  if (session?.status === "expired") return "failed";
  if (session?.status === "complete") return "processing";
  return "unpaid";
};

const ensureStripeConfigured = (res) => {
  if (!stripe) {
    res.status(500).json({ message: "Stripe is not configured. Set STRIPE_SECRET_KEY." });
    return false;
  }

  return true;
};

const getNextOrderStatus = (status) => {
  const currentIndex = ORDER_STATUS_STAGES.indexOf(status);
  if (currentIndex === -1) return null;
  return ORDER_STATUS_STAGES[currentIndex + 1] || null;
};

const createOrderWithUniqueToken = async (payload) => {
  let lastError;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await Order.create({ ...payload, orderToken: generateOrderToken() });
    } catch (error) {
      lastError = error;

      if (error?.code === 11000 && error?.keyPattern?.orderToken) {
        continue;
      }

      throw error;
    }
  }

  throw lastError;
};

export const getAvailableMenuItems = async (_req, res, next) => {
  try {
    const items = await MenuItem.find({ isAvailable: true })
      .select("name category price sortOrder")
      .sort({ category: 1, sortOrder: 1, name: 1 });

    res.json({ items });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const { orderType, customerName, tableNumber, items, paymentMethod } = req.body;
    const trimmedCustomerName = String(customerName || "").trim();
    const normalizedPaymentMethod = String(paymentMethod || "cash").toLowerCase();

    if (!trimmedCustomerName) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    if (!PAYMENT_METHODS.includes(normalizedPaymentMethod)) {
      return res.status(400).json({ message: "Payment method must be cash or digital" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Add at least one menu item" });
    }

    const totalAmount = (items || []).reduce((sum, item) => {
      const line = Number(item.quantity || 0) * Number(item.price || 0);
      return sum + line;
    }, 0);

    const paymentAmountMinor = toMinorAmount(totalAmount);
    const isCashPayment = normalizedPaymentMethod === "cash";

    const orderPayload = {
      orderType,
      customerName: trimmedCustomerName,
      tableNumber,
      items,
      totalAmount,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: isCashPayment ? "paid" : "unpaid",
      paymentAmountMinor,
      paymentCurrency: env.stripeCurrency,
      paidAt: isCashPayment ? new Date() : null,
      createdBy: req.user._id
    };

    const order = await createOrderWithUniqueToken(orderPayload);

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
};

export const updateMyOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({ _id: orderId, createdBy: req.user._id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const nextStatus = getNextOrderStatus(order.status);

    if (!nextStatus) {
      return res.status(400).json({ message: "Order is already completed" });
    }

    if (status && status !== nextStatus) {
      return res.status(400).json({
        message: `Invalid status transition. Next stage must be ${nextStatus}`
      });
    }

    order.status = nextStatus;
    await order.save();

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

export const createMyOrderPaymentIntent = async (req, res, next) => {
  try {
    if (!ensureStripeConfigured(res)) {
      return;
    }

    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, createdBy: req.user._id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentMethod !== "digital") {
      return res.status(400).json({ message: "This order is marked for cash payment" });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Order is already paid" });
    }

    const amount = toMinorAmount(order.totalAmount);

    if (amount <= 0) {
      return res.status(400).json({ message: "Order amount must be greater than zero" });
    }

    let paymentIntent = null;

    if (order.paymentIntentId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(order.paymentIntentId);
        if (existing.status !== "canceled" && existing.status !== "succeeded") {
          paymentIntent = existing;
        }
      } catch (_error) {
        paymentIntent = null;
      }
    }

    if (!paymentIntent) {
      paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: env.stripeCurrency,
        metadata: {
          orderId: String(order._id),
          orderToken: order.orderToken || "",
          createdBy: String(req.user._id)
        },
        automatic_payment_methods: { enabled: true }
      });
    }

    order.paymentIntentId = paymentIntent.id;
    order.paymentAmountMinor = paymentIntent.amount;
    order.paymentCurrency = paymentIntent.currency;
    order.paymentStatus = mapStripeStatusToPaymentStatus(paymentIntent.status);
    order.paidAt = order.paymentStatus === "paid" ? new Date() : null;
    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentStatus: order.paymentStatus
    });
  } catch (error) {
    next(error);
  }
};

export const createMyOrderCheckoutSession = async (req, res, next) => {
  try {
    if (!ensureStripeConfigured(res)) {
      return;
    }

    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, createdBy: req.user._id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentMethod !== "digital") {
      return res.status(400).json({ message: "This order is marked for cash payment" });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Order is already paid" });
    }

    const amount = toMinorAmount(order.totalAmount);

    if (amount <= 0) {
      return res.status(400).json({ message: "Order amount must be greater than zero" });
    }

    const token = order.orderToken || String(order._id).slice(-6).toUpperCase();
    const tableText = order.tableNumber ? `Table ${order.tableNumber}` : "No Table";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: env.stripeCurrency,
            product_data: {
              name: `Order ${token}`,
              description: `${order.customerName} • ${tableText}`
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      metadata: {
        orderId: String(order._id),
        orderToken: order.orderToken || "",
        createdBy: String(req.user._id)
      },
      success_url: `${env.clientOrigin}/staff/orders?payment=success&orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.clientOrigin}/staff/orders?payment=cancel&orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`
    });

    order.paymentStatus = "processing";
    order.paymentAmountMinor = amount;
    order.paymentCurrency = env.stripeCurrency;
    await order.save();

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    next(error);
  }
};

export const verifyMyOrderCheckoutSession = async (req, res, next) => {
  try {
    if (!ensureStripeConfigured(res)) {
      return;
    }

    const { orderId } = req.params;
    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const order = await Order.findOne({ _id: orderId, createdBy: req.user._id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"]
    });

    if (session.metadata?.orderId && session.metadata.orderId !== String(order._id)) {
      return res.status(400).json({ message: "Checkout session does not belong to this order" });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || "";

    order.paymentIntentId = paymentIntentId;
    order.paymentAmountMinor = Number(session.amount_total || toMinorAmount(order.totalAmount));
    order.paymentCurrency = session.currency || env.stripeCurrency;
    order.paymentStatus = mapCheckoutSessionStatusToPaymentStatus(session);
    order.paidAt = order.paymentStatus === "paid" ? new Date() : null;
    await order.save();

    res.json({ order, paymentStatus: session.payment_status, sessionStatus: session.status });
  } catch (error) {
    next(error);
  }
};

export const confirmMyOrderPayment = async (req, res, next) => {
  try {
    if (!ensureStripeConfigured(res)) {
      return;
    }

    const { orderId } = req.params;
    const { paymentIntentId } = req.body || {};

    const order = await Order.findOne({ _id: orderId, createdBy: req.user._id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const intentId = paymentIntentId || order.paymentIntentId;

    if (!intentId) {
      return res.status(400).json({ message: "No payment intent found for this order" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(intentId);

    if (paymentIntent.metadata?.orderId && paymentIntent.metadata.orderId !== String(order._id)) {
      return res.status(400).json({ message: "Payment intent does not belong to this order" });
    }

    order.paymentIntentId = paymentIntent.id;
    order.paymentAmountMinor = paymentIntent.amount;
    order.paymentCurrency = paymentIntent.currency;
    order.paymentStatus = mapStripeStatusToPaymentStatus(paymentIntent.status);
    order.paidAt = order.paymentStatus === "paid" ? new Date() : null;
    await order.save();

    res.json({ order, stripeStatus: paymentIntent.status });
  } catch (error) {
    next(error);
  }
};

export const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

export const updateMyTaskStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: taskId, assignedTo: req.user._id },
      { status },
      { new: true }
    )
      .populate("assignedBy", "name email")
      .populate("assignedTo", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
};
