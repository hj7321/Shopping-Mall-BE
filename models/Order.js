const mongoose = require("mongoose");
const User = require("./User");
const Product = require("./Product");
const Schema = mongoose.Schema;
const orderSchema = Schema(
  {
    userId: {
      type: mongoose.ObjectId,
      ref: User,
    },
    toShip: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.ObjectId,
          ref: Product,
        },
        size: {
          type: String,
          required: true,
        },
        qty: {
          type: Number,
          default: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
