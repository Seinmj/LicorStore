const express = require('express');

const {createAddress,deleteAddress,getAddress,getAddressById,getAddressIdLicorera,updateAddress,getAddressIdUser,createAddressUser}= require("../controllers/address.controllers");

const router = express.Router();

router.get("/direcciones",getAddress);
router.get("/idDireccion/:id",getAddressById);
router.get("/idLicoreraDirecciones/:idLicorera",getAddressIdLicorera);
router.get("/idusuarioDirecciones/:idUsuario",getAddressIdUser);
router.post("/createDireccion",createAddress);
router.put("/updateDireccion/:id",updateAddress);
router.delete("/deleteDireccion/:id",deleteAddress);
router.post("/createDireccionUsuario/:idUsuario",createAddressUser);

module.exports = router;