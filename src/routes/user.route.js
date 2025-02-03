const express = require('express');

const { login, register, getUserStatus, updateUser, registerAdmin, registerUserDireccion, updateUserCedula, updateUserContrasenia, updateUserToken, updateUserEspecial } = require("../controllers/user.controllers");

const router = express.Router();

router.post("/Registro", register);
router.post("/RegistroPorSeleccion", registerAdmin);
router.post("/RegistroUserDireccion", registerUserDireccion);
router.get("/estadoUsuario", getUserStatus);
router.post("/login", login);
router.put("/actualizarUsuario/:idUsuario", updateUser);
router.put("/actualizarUsuarioToken/:idUsuario", updateUserToken);
router.put("/actualizarUsuarioContrasenia/:idUsuario", updateUserContrasenia);
router.put("/actualizarUsuarioCedula/:idUsuario", updateUserCedula);
router.put("/actualizarUsuarioEspecial/:idUsuario", updateUserEspecial);


module.exports = router;