const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const productController = require('../controllers/productController');

router.use(auth);

router.post('/add', productController.addProduct);
router.get('/', productController.getProducts);
router.post('/update', productController.updateProduct);
router.post('/delete', productController.removeProduct);
router.delete('/remove', productController.removeProduct);

module.exports = router;