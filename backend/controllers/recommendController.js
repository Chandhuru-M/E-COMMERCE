

const recService = require("../services/recommendationEngine");
const Product = require("../models/productModel");

exports.searchController = async (req, res) => {
  try {
    const { query, page, limit } = req.body;
    const userId = req.user?._id; // auth middleware attaches user
    const result = await recService.searchProducts(query, userId, { page, limit });
    return res.status(200).json(result);
  } catch (err) {
    console.error("recommend.searchController:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.selectFakeController = async (req, res) => {
  try {
    const { fakeProduct } = req.body;
    if (!fakeProduct) return res.status(400).json({ success: false, message: "fakeProduct required" });

    const result = await recService.importFakeToDB(fakeProduct);
    if (!result.success) return res.status(400).json(result);

    return res.status(201).json({ success: true, product: result.product });
  } catch (err) {
    console.error("recommend.selectFakeController:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.saveSelectedProduct = async (req, res) => {
  try {
    const { fakeId, rawFake } = req.body;

    if (!fakeId || !rawFake) {
      return res.status(400).json({ success: false, message: "Missing fakeId or rawFake" });
    }

    // Check if already saved
    const exists = await Product.findOne({ "metadata.fakeStoreId": fakeId });
    if (exists) {
      return res.json({ success: true, message: "Already saved", product: exists });
    }

    // Save in Product model format
    const newProduct = await Product.create({
      name: rawFake.title,
      price: rawFake.price,
      description: rawFake.description,
      images: [{ image: rawFake.image }],
      category: convertCategory(rawFake.category),
      seller: "FakeStore",
      stock: 20,
      numOfReviews: rawFake?.rating?.count || 0,
      ratings: rawFake?.rating?.rate || 0,
      metadata: {
        fakeStoreId: fakeId,
      }
    });

    return res.json({
      success: true,
      message: "FakeStore product saved to DB",
      product: newProduct,
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

function convertCategory(cat) {
  const map = {
    men: "Clothes/Shoes",
    women: "Clothes/Shoes",
    electronics: "Electronics",
    jewelery: "Accessories"
  };
  return map[cat?.toLowerCase()] || "Home";
}

exports.trendingController = async (req, res) => {
  try {
    // simple wrapper to return product docs for trending ids
    const days = Number(req.query.days) || 7;
    const ids = await recService.getTrendingProductIds(days, 20);
    // fetch products in the same order
    const products = await Promise.all(ids.map(id => Product.findById(id).lean().catch(()=>null)));
    return res.status(200).json({ success: true, data: products.filter(Boolean) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
