const Cart = require("../models/Cart");
const productController = require("./product.controller");

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
    const { id, qty, size } = req.body;
    // id : 장바구니에 있는 특정 아이템의 고유 ID
    // qty : 변경하려는 새로운 수량(qty)값
    // size : 변경하려는 새로운 사이즈(size)값

    // 업데이트할 내용
    const updateFields = {};
    if (qty !== undefined) updateFields["items.$.qty"] = qty;
    if (size !== undefined) updateFields["items.$.size"] = size;

    const updatedCart = await Cart.findOneAndUpdate(
      { userId, "items._id": id }, // 업데이트할 문서를 찾기 위한 조건
      { $set: updateFields }, // 업데이트할 내용
      { new: true } // 업데이트 후 변경된 문서의 정보를 반환
    ).populate("items.productId"); // items 배열의 productId 필드에 실제 상품 정보를 채워넣음

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
    // id : 삭제하려는 장바구니 아이템의 고유 ID

    const updatedCart = await Cart.findOneAndUpdate(
      { userId }, // 업데이트할 문서를 찾기 위한 조건
      { $pull: { items: { _id: id } } }, // 업데이트할 내용
      // $pull : 배열에서 특정 조건을 만족하는 모든 요소를 제거
      { new: true } // 업데이트 후 변경된 문서의 정보를 반환
    ).populate("items.productId"); // items 배열의 productId 필드에 실제 상품 정보를 채워넣음
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

cartController.checkCartStock = async (req, res) => {
  try {
    const { userId } = req;
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res
        .status(400)
        .json({ status: "failed", message: "장바구니가 비어있습니다." });
    }
    const insufficientStockItems = await productController.checkItemListStock(
      cart.items
    );
    if (insufficientStockItems.length > 0) {
      const messages = insufficientStockItems
        .map((item) => item.message)
        .join(", ");
      return res.status(400).json({ status: "failed", message: messages });
    }
    res
      .status(200)
      .json({ status: "success", message: "모든 상품 재고가 충분합니다." });
  } catch (error) {
    res.status(400).json({ status: "failed", message: error.message });
  }
};

module.exports = cartController;
