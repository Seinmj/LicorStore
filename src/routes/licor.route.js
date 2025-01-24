const express = require('express');

const {createLicorera,deleteLicorera,getLicoreraById,getLicoreras,getLicorerasIdUser,updateLicorera,updateEstadoLicorera,createLicoreraAddress}= require("../controllers/licor.controllers");

const router = express.Router();

router.get("/licoreras",getLicoreras);
router.get("/idLicorera/:idLicorera",getLicoreraById);
router.get("/idLicoreraUser/:idUser",getLicorerasIdUser);
router.post("/createLicorera",createLicorera);
router.put("/updateLicorera/:idLicorera",updateLicorera);
router.put("/updateEstadoLicorera/:idLicorera",updateEstadoLicorera);
router.delete("/deleteLicorera/:id",deleteLicorera);
router.post("/createLicoreraDireccion",createLicoreraAddress);

module.exports = router;