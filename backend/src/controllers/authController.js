import { env } from "../config/env.js";
import { registerUser, validateLogin } from "../services/authService.js";
import { signToken } from "../utils/token.js";

const buildAuthResponse = (user) => {
  const token = signToken({ userId: user._id, role: user.role }, env.jwtSecret, env.jwtExpiresIn);
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      shift: user.shift
    }
  };
};

export const registerOwner = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await registerUser({ name, email, password, role: "owner" });
    res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
};

export const registerStaff = async (req, res, next) => {
  try {
    const { name, email, password, shift } = req.body;
    const user = await registerUser({ name, email, password, role: "staff", shift });
    res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
};

export const loginOwner = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await validateLogin({ email, password, role: "owner" });
    res.json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
};

export const loginStaff = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await validateLogin({ email, password, role: "staff" });
    res.json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};
