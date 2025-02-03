const express = require('express');

const { login, register, getUserStatus, updateUser, registerAdmin, registerUserDireccion } = require("../controllers/user.controllers");

const router = express.Router();

router.post("/Registro", register);
router.post("/RegistroPorSeleccion", registerAdmin);
router.post("/RegistroUserDireccion", registerUserDireccion);
router.get("/estadoUsuario", getUserStatus);
router.post("/login", login);
router.put("/actualizarUsuario/:idUsuario", updateUser);

module.exports = router;