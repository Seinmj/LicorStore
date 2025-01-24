const express = require('express');

const {
    createProducto,
    getProductos,
    getProductoById,
    getProductoByIdCategoria,
    updateProducto,
    deleteProducto
} = require('../controllers/product.controllers');

const router = express.Router();

router.post('/createProducto', createProducto);
router.get('/productos', getProductos);
router.get('/getIdProducto/:idProducto', getProductoById);
router.get('/getIdCategoriaProducto/:idCategoria', getProductoByIdCategoria);
router.put('/updateProducto/:idProducto', updateProducto);
router.delete('/deleteProducto/:idProducto', deleteProducto);

module.exports = router;