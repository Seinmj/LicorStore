const pool = require("../db/db.js");

const createLicorera = async (req, res)=>{
    const data = req.body;
    const query= "INSERT INTO licorera(nombre, descripcion, id_usuario, fecha_registro, abierta, id_direccion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;";
    try {
        const {rows} = await pool.query(query,
            [data.nombreLicorera,data.descripcion,data.idUser,data.fecha,data.estado,data.direccion]
        );
        res.status(200).json({
            message: "Licorera registrada",
            direccio:rows[0]
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al crear la licorera",
            error: error.message
        });
    }
}

const getLicoreras = async (req, res) => {
    try {
        const query = "SELECT * FROM licorera;";
        const { rows } = await pool.query(query);

        res.status(200).json({
            message: "Lista de licoreras obtenida con éxito",
            licoreras: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener las licoreras",
            error: error.message
        });
    }
};
const getLicorerasIdUser = async (req, res) => {
    const id = req.params.idUser;
    try {
        const query = "SELECT * FROM licorera WHERE id_usuario= $1;";
        const { rows } = await pool.query(query,[id]);

        res.status(200).json({
            message: "Lista de licoreras obtenida con éxito",
            licoreras: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener las licoreras",
            error: error.message
        });
    }
};

const getLicoreraById = async (req, res) => {
    const id = req.params.idLicorera;

    try {
        const query = "SELECT * FROM licorera WHERE id_licorera = $1;";
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Licorera no encontrada"
            });
        }

        res.status(200).json({
            message: "Licorera obtenida con éxito",
            licorera: rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener la licorera",
            error: error.message
        });
    }
};

const updateLicorera = async (req, res) => {
    const id = req.params.idLicorera;
    const data = req.body;

    try {
        const query = `
            UPDATE licorera 
            SET nombre = $1, descripcion = $2, abierta = $3, id_direccion = $4 
            WHERE id_licorera = $5 
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [
            data.nombreLicorera,
            data.descripcion,
            data.estado,
            data.direccion,
            id
        ]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Licorera no encontrada"
            });
        }

        res.status(200).json({
            message: "Licorera actualizada con éxito",
            licorera: rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al actualizar la licorera",
            error: error.message
        });
    }
};

const updateEstadoLicorera = async (req, res) => {
    const id = req.params.idLicorera;
    const data = req.body;

    try {
        const query = `
            UPDATE licorera 
            SET abierta = $1 
            WHERE id_licorera = $2 
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [
            data.estado,
            id
        ]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Licorera no encontrada"
            });
        }

        res.status(200).json({
            message: "Estado de la licorera actualizada con éxito",
            licorera: rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al actualizar la licorera",
            error: error.message
        });
    }
};

const deleteLicorera = async (req, res) => {
    const id = req.params.id;

    try {
        const query = "DELETE FROM licorera WHERE id_licorera = $1 RETURNING *;";
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Licorera no encontrada"
            });
        }

        res.status(200).json({
            message: "Licorera eliminada con éxito",
            licorera: rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al eliminar la licorera",
            error: error.message
        });
    }
};
const createLicoreraAddress = async (req, res) => {
    const { licorera } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        //Crear la direccion
        const insertAddressQuery = `
            INSERT INTO direccion (latitud, longitud, calle_principal, calle_secundaria, referencia)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id_direccion
        `;
        const addressResult = await client.query(insertAddressQuery, [
            licorera.direccion.latitud,
            licorera.direccion.longitud,
            licorera.direccion.calle_principal,
            licorera.direccion.calle_secundaria,
            licorera.direccion.referencia
        ]);

        const addressId = addressResult.rows[0].id_direccion;

        // Crear la licorera
        const insertLicoreraQuery = `
            INSERT INTO licorera(nombre, descripcion, id_usuario, fecha_registro, abierta, id_direccion) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        const licoreraResult = await client.query(insertLicoreraQuery, [
            licorera.nombre,
            licorera.idUsuario,
            licorera.fecha_registro,
            licorera.abierta,
            addressId
        ]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Licorera, dirección y asociación creados con éxito',
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
module.exports = {
    createLicorera,
    getLicoreras,
    getLicoreraById,
    getLicorerasIdUser,
    updateLicorera,
    updateEstadoLicorera,
    deleteLicorera,
    createLicoreraAddress
};