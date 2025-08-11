const Cart = require("../models/Cart");

const cartController = {};

cartController.addItemToCart = async (req, res) => {
  try {
    const { userId } = req;
    const { productId, size, qty } = req.body;
    // userId로 카트 찾기
    let cart = await Cart.findOne({ userId });
    // 유저가 만든 카드가 없으면 -> 만들어 주기!
    if (!cart) {
      cart = new Cart({ userId });
      await cart.save();
    }
    // 이미 카트에 들어가 있는 아이템이면(productId, size) -> 에러 메시지
    const existedItem = cart.items.find(
      (item) => item.productId.equals(productId) && item.size === size
    );
    if (existedItem) {
      throw new Error("아이템이 이미 카트에 있습니다.");
    }
    // 새로운 아이템이면 -> 카트에 아이템 추가
    cart.items = [...cart.items, { productId, size, qty }];
    await cart.save();
    res
      .status(200)
      .json({ status: "success", data: cart, cartItemQty: cart.items.length });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

cartController.getCart = async (req, res) => {
  try {
    const { userId } = req;
    // userId로 카트 찾기
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    const items = cart ? cart.items : [];
    res.status(200).json({ status: "success", data: items });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

cartController.getCartQty = async (req, res) => {
  try {
    const { userId } = req;
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json({ status: "success", data: 0 });
    }
    res.status(200).json({ status: "success", data: cart.items.length });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

cartController.updateCart = async (req, res) => {
  try {
    const { userId } = req;
    const { id, value } = req.body;

    const updatedCart = await Cart.findOneAndUpdate(
      { userId, "items._id": id },
      { $set: { "items.$.qty": value } },
      { new: true }
    ).populate("items.productId");
    if (!updatedCart) {
      return res
        .status(404)
        .json({ status: "failed", message: "상품을 찾을 수 없습니다." });
    }
    res.status(200).json({ status: "success", data: updatedCart.items });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

cartController.deleteCart = async (req, res) => {
  try {
    const { userId } = req;
    const { id } = req.body;

    const updatedCart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { _id: id } } },
      { new: true }
    ).populate("items.productId");
    if (!updatedCart) {
      return res
        .status(404)
        .json({ status: "failed", message: "상품을 찾을 수 없습니다." });
    }
    res.status(200).json({ status: "success", data: updatedCart.items });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

module.exports = cartController;
