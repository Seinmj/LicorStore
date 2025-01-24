const express = require('express');

const {createPedido,getDetallesByPedidoId,getPedidosByEstadoAndLicorera,updateTotalPedido,getPedidoById}= require("../controllers/order.controllers");

const router = express.Router();

router.get('/idPedido/:idPedido', getPedidoById);
router.get("/detallesPedido/:idPedido",getDetallesByPedidoId);
router.get("/estado/:estado/licorera/:idLicorera",getPedidosByEstadoAndLicorera);
router.post("/createPedido",createPedido);
router.put("/updatePedido/:idPedido",updateTotalPedido);


module.exports = router;