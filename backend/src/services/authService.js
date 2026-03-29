import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";

export const registerUser = async ({ name, email, password, role, shift }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    shift: role === "staff" ? shift : undefined
  });

  return user;
};

export const validateLogin = async ({ email, password, role }) => {
  const user = await User.findOne({ email: email.toLowerCase(), role });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) {
    throw new ApiError(401, "Invalid credentials");
  }

  return user;
};
