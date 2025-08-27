import { body } from "express-validator";

export const saleCreateRules = [
  body("productId").notEmpty(),
  body("type").isIn(["Sale","Return","Restock"]),
  body("qty").isInt({ min: 1 }),
  body("unitPrice").isFloat({ min: 0 })
];
