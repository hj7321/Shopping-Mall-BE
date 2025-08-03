const express = require("express");
const authCountroller = require("../controllers/auth.controller");
const productController = require("../controllers/product.controller");
const router = express.Router();

router.post(
  "/",
  authCountroller.authenticate,
  authCountroller.checkAdminPermission,
  productController.createProduct
);
router.get("/", productController.readProducts);

module.exports = router;
