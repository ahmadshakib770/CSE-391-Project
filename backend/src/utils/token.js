import jwt from "jsonwebtoken";

export const signToken = ({ userId, role }, secret, expiresIn) =>
  jwt.sign({ sub: userId, role }, secret, { expiresIn });
