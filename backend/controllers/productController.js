const Product = require('../models/products');

exports.addProduct = async (req, res) => {
  try {
    const product = new Product({ ...req.body, companyId: req.user.id, isStaged: false });
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getProducts = async (req, res) => {
  const { staged, page = 1, limit = 10, search = '' } = req.query;
  const filter = staged === 'true' ? { isStaged: true } : { isStaged: false };
  const query = {
    ...filter,
    companyId: req.user.id,
    ...(search && { $or: [
      { brand: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { product_id: { $regex: search, $options: 'i' } }
    ]})
  };
  try {
    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Product.countDocuments(query);
    res.json({ products, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { product_id, ...updates } = req.body;
    const product = await Product.findOneAndUpdate(
      { product_id: product_id, companyId: req.user.id },
      { ...updates, isStaged: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.removeProduct = async (req, res) => {
  try {
    const { product_id } = req.body;
    const product = await Product.findOneAndDelete(
      { product_id: product_id, companyId: req.user.id }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};