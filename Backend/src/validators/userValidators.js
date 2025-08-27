import { body } from "express-validator";

export const userCreateRules = [
  body("fullName").trim().notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  body("role").optional().isIn(["Admin","Manager","Staff","Cashier","Client"])
];

export const userUpdateRules = [
  body("fullName").optional().trim().notEmpty(),
  body("email").optional().isEmail(),
  body("password").optional().isLength({ min: 6 }),
  body("role").optional().isIn(["Admin","Manager","Staff","Cashier","Client"]),
  body("active").optional().isBoolean()
];
