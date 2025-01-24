const express = require('express');

const {createCategoria,deleteCategoria,getCategorias,updateCategoria}= require("../controllers/category.controllers");

const router = express.Router();

router.get("/categorias/:idLicorera",getCategorias);
router.post("/createCategoria",createCategoria);
router.put("/updateCategoria/:idCategoria",updateCategoria);
router.delete("/deleteCategoria/:idCategoria",deleteCategoria);

module.exports = router;