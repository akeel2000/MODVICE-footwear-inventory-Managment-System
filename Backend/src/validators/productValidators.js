import { body } from "express-validator";

export const productCreateRules = [
  body("name").trim().notEmpty().withMessage("Name required"),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price invalid"),
  body("quantity").optional().isInt({ min: 0 }).withMessage("Qty invalid"),
  body("reorderThreshold").optional().isInt({ min: 0 }).withMessage("Threshold invalid"),
];

export const productUpdateRules = [
  body("name").optional().trim().notEmpty(),
  body("price").optional().isFloat({ min: 0 }),
  body("quantity").optional().isInt({ min: 0 }),
  body("reorderThreshold").optional().isInt({ min: 0 }),
];
