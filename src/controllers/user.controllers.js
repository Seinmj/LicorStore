const pool = require("../db/db.js");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM users;")
    res.status(200).json({
        usuarios: rows,
        response: true
    })
}
const register = async (req, res, next) => {
    const data = req.body;
    try {
        const checkQuery = `
            SELECT * FROM public.usuario 
            WHERE correo = $1 OR cedula = $2
        `;
        const checkResult = await pool.query(checkQuery, [data.correo, data.cedula]);

        if (checkResult.rows.length > 0) {

            return res.status(400).json({
                message: "El correo o la cédula ya están registrados",
                error: "Duplicated fields",
                response: false
            });
        }

        const hashedPass = await bcrypt.hash(data.contrasenia, 10);

        const { rows } = await pool.query(
            "INSERT INTO usuario (cedula, nombres, apellidos, correo, telefono, rol, estado, contrasenia,token_notific, id_tipo_usuario) VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9,$10) RETURNING *",
            [data.cedula, data.nombres, data.apellidos, data.correo, data.telefono, "Gente Normal", data.estado, hashedPass, data.token_notific, 2]
        );

        res.status(201).json({
            message: "Usuario registrado con éxito",
            usuario: rows[0],
            response: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al registrar el usuario",
            error: err.message,
            response: false
        });
    }
}
const registerAdmin = async (req, res, next) => {
    const data = req.body;
    try {
        const checkQuery = `
            SELECT * FROM usuario 
            WHERE correo = $1 OR cedula = $2
        `;
        const checkResult = await pool.query(checkQuery, [data.correo, data.cedula]);

        if (checkResult.rows.length > 0) {

            return res.status(400).json({
                message: "El correo o la cédula ya están registrados",
                error: "Duplicated fields",
                response: false
            });
        }

        const hashedPass = await bcrypt.hash(data.contrasenia, 10);

        const { rows } = await pool.query(
            "INSERT INTO usuario (cedula, nombres, apellidos, correo, telefono, rol, estado, contrasenia, token_notific, id_tipo_usuario) VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9,$10) RETURNING *",
            [data.cedula, data.nombres, data.apellidos, data.correo, data.telefono, data.rol, data.estado, hashedPass, data.token_notific, data.tipoUsuario]
        );

        res.status(201).json({
            message: "Usuario registrado con éxito",
            usuario: rows[0],
            response: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al registrar el usuario",
            error: err.message,
            response: false
        });
    }
}
const registerUserDireccion = async (req, res) => {
    const { usuario } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Crear el usuario
        const insertUserQuery = `
            INSERT INTO usuario (cedula, nombres, apellidos, telefono, correo, rol, estado, contrasenia, token_notific, id_tipo_usuario) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING id_usuario
        `;
        const hashedPassword = await bcrypt.hash(usuario.contrasenia, 10);
        const userResult = await client.query(insertUserQuery, [
            usuario.cedula,
            usuario.nombres,
            usuario.apellidos,
            usuario.telefono,
            usuario.correo,
            usuario.rol,
            usuario.estado,
            hashedPassword,
            usuario.tokenNotific,
            usuario.id_tipo_usuario
        ]);

        const userId = userResult.rows[0].id_usuario;

        // Crear la dirección
        const insertAddressQuery = `
            INSERT INTO direccion (latitud, longitud, calle_principal, calle_secundaria, referencia)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id_direccion
        `;
        const addressResult = await client.query(insertAddressQuery, [
            usuario.direccion.latitud,
            usuario.direccion.longitud,
            usuario.direccion.calle_principal,
            usuario.direccion.calle_secundaria,
            usuario.direccion.referencia
        ]);

        const addressId = addressResult.rows[0].id_direccion;

        // Se asocia el usuario con la dirección
        const associateQuery = `
            INSERT INTO direccion_usuario (id_direccion, id_usuario)
            VALUES ($1, $2)
        `;
        await client.query(associateQuery, [addressId, userId]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Usuario, dirección y asociación creados con éxito',
            response: true
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en la transacción:', error.message);
        res.status(500).json({
            message: 'Error al crear el usuario o la dirección',
            error: error.message,
            response: false
        });
    } finally {
        client.release();
    }
};

const login = async (req, res, next) => {
    const { cedula, contrasenia } = req.body;

    try {
        const result = await pool.query(
            "SELECT id_usuario, nombres, apellidos, contrasenia, cedula, correo, telefono, token_notific, rol, estado, id_tipo_usuario FROM usuario WHERE cedula = $1",
            [cedula]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Usuario incorrecto",
                response: false
            });
        }

        const user = result.rows[0];

        const match = await bcrypt.compare(contrasenia, user.contrasenia);

        if (!match) {
            return res.status(401).json({
                message: "Contraseña incorrecta",
                response: false
            });
        }

        const token = jwt.sign(
            { id: user.id_usuario, nombres: user.nombres },
            "verySecretValue",
            { expiresIn: "1h" }
        );

        const usuario = {
            id_usuario: user.id_usuario,
            nombres: user.nombres,
            apellidos: user.apellidos,
            cedula: user.cedula,
            telefono: user.telefono,
            correo: user.correo,
            tokenNotific: user.token_notific,
            rol: user.rol,
            estado: user.estado,
            id_tipo_usuario: user.id_tipo_usuario
        };

        return res.status(200).json({
            message: "Inicio de sesión exitoso!",
            token,
            usuario,
            response: true
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Error en el servidor",
            response: false,
            error: err.message
        });
    }
}
const getUserStatus = async (req, res) => {
    const { idUsuario } = req.query;
    try {
        const query = `
            SELECT estado 
            FROM usuario
            WHERE id_usuario = $1;
        `;

        const { rows } = await pool.query(query, [idUsuario]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: `No se encontró un usuario con el ID ${idUsuario}`,
                response: false
            });
        }

        res.status(200).json({
            message: "Estado del usuario obtenido con éxito",
            estado: rows[0].estado,
            response: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al obtener el estado del usuario",
            error: err.message,
            response: false
        });
    }
};
const updateUser = async (req, res) => {
    const { idUsuario } = req.params;
    const data = req.body;

    /* if (!rol) {
        return res.status(400).json({
            message: "El campo 'nombre' es obligatorio"
        });
    } */
    try {
        const query = `
            UPDATE usuario
	        SET  cedula=$1, nombres=$2, apellidos=$3, telefono=$4, correo=$5, rol=$6, estado=$7, id_tipo_usuario=$8, token_notific=$9 
            WHERE id_usuario = $10
            RETURNING *;
        `;

        const { rows } = await pool.query(query, [data.cedula, data.nombres, data.apellidos, data.telefono, data.correo, data.rol, data.estado, data.id_tipo_usuario, data.token_notific, idUsuario]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: `No se encontró un usuario con el ID ${idUsuario}`,
                response: false
            });
        }

        res.status(200).json({
            message: "Usuario actualizado con éxito",
            usuario: rows[0],
            response: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al actualizar el usuario",
            error: err.message,
            response: false
        });
    }
};
const updateUserRole = async (req, res) => {
    const { idUsuario } = req.params;
    const { rol, tipoUsuario } = req.body;

    if (!rol) {
        return res.status(400).json({
            message: "El campo 'rol' es obligatorio",
            response: false
        });
    }

    try {
        const query = `
            UPDATE usuario
            SET rol = $1, id_tipo_usuario=$2
            WHERE id_usuario = $3
            RETURNING *;
        `;
        const values = [rol, tipoUsuario, idUsuario];

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({
                message: `No se encontró un usuario con el ID ${idUsuario}`,
                response: false
            });
        }

        res.status(200).json({
            message: "Rol del usuario actualizado con éxito",
            usuario: rows[0],
            response: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al actualizar el rol del usuario",
            error: err.message,
            response: false
        });
    }
};
const updateUserContrasenia = async (req, res) => {
    const { idUsuario } = req.params;
    const { contrasenia } = req.body;

    if (!contrasenia) {
        return res.status(400).json({
            message: "El campo 'contrasenia' es obligatorio"
        });
    }
    const hashedPass = await bcrypt.hash(contrasenia, 10);
    try {
        const query = `
            UPDATE usuario
	        SET  contrasenia=$1, 
            WHERE id_usuario = $2
            RETURNING *;
        `;

        const { rows } = await pool.query(query, [hashedPass, idUsuario]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: `No se encontró un usuario con el ID ${idUsuario}`,
                response: false
            });
        }

        res.status(200).json({
            message: "Contraseña del usuario actualizada con éxito",
            usuario: rows[0],
            response: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al actualizar la contraseña",
            error: err.message,
            response: false
        });
    }
};
const updateUserCedula = async (req, res) => {
    const { idUsuario } = req.params;
    const { cedula } = req.body;

    if (!rol) {
        return res.status(400).json({
            message: "El campo 'cedula' es obligatorio"
        });
    }
    try {
        const query = `
            UPDATE usuario
	        SET  cedula=$1, 
            WHERE id_usuario = $2
            RETURNING *;
        `;

        const { rows } = await pool.query(query, [cedula, idUsuario]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: `No se encontró un usuario con el ID ${idUsuario}`,
                response: false
            });
        }

        res.status(200).json({
            message: "Usuario actualizado con éxito",
            usuario: rows[0],
            response: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al actualizar el usuario",
            error: err.message,
            response: false
        });
    }
};
const updateUserToken = async (req, res) => {
    const { idUsuario } = req.params;
    const { tokenNotific } = req.body;

    if (!tokenNotific) {
        return res.status(400).json({
            message: "El campo 'tokenNotific' es obligatorio"
        });
    }
    const hashedPass = await bcrypt.hash(token, 10);
    try {
        const query = `
            UPDATE usuario
	        SET  token_notific=$1
            WHERE id_usuario = $2
            RETURNING *;
        `;

        const { rows } = await pool.query(query, [tokenNotific, idUsuario]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: `No se encontró un usuario con el ID ${idUsuario}`,
                response: false
            });
        }

        res.status(200).json({
            message: "token del usuario actualizado con éxito",
            usuario: rows[0],
            response: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al actualizar el token del usuario",
            error: err.message,
            response: false
        });
    }
};
const updateUserEspecial = async (req, res) => {
    const { idUsuario } = req.params;
    const data = req.body;

    if (!rol) {
        return res.status(400).json({
            message: "El campo 'rol' es obligatorio"
        });
    }
    try {
        const query = `
            UPDATE usuario
	        SET  cedula=$1, rol=$2, estado=$3, id_tipo_usuario=$4, token_notific=$5 
            WHERE id_usuario = $6
            RETURNING *;
        `;

        const { rows } = await pool.query(query, [data.cedula, data.rol, data.estado, data.tipoUsuario, data.tokenNotific, idUsuario]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: `No se encontró un usuario con el ID ${idUsuario}`,
                response: false
            });
        }

        res.status(200).json({
            message: "Usuario actualizado con éxito",
            usuario: rows[0],
            response: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al actualizar el usuario",
            error: err.message,
            response: false
        });
    }
};
module.exports = {
    register, registerUserDireccion, registerAdmin, login, getUserStatus, updateUser, updateUserRole, updateUserContrasenia, updateUserCedula, updateUserToken, updateUserEspecial, getUsers
}
