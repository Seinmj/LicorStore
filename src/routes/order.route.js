const express = require('express');

const {createPedido,getDetallesByPedidoId,getPedidosByEstadoAndLicorera, getPedidoBEstadoAndUserId ,updateTotalPedido,getPedidoById, updateEstadoPedido}= require("../controllers/order.controllers");

const router = express.Router();

router.get('/idPedido/:idPedido', getPedidoById);
router.get("/detallesPedido/:idPedido",getDetallesByPedidoId);
router.get("/estado/:estado/licorera/:idLicorera", getPedidosByEstadoAndLicorera);
router.get("/estado/:estado/usuario/:idUsuario", getPedidoBEstadoAndUserId);
router.post("/createPedido",createPedido);
router.put("/updatePedido/:idPedido", updateTotalPedido);
router.put("/updateEstadoPedido/:idPedido", updateEstadoPedido);


module.exports = router;