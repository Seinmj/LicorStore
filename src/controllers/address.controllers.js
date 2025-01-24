const pool = require("../db/db.js");

const createAddress = async (req, res)=>{
    const data = req.body;
    try {
        const {rows} = await pool.query("INSERT INTO direccion(latitud, longitud, calle_principal, calle_secundaria, referencia) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [data.latitud,data.longitud,data.callePrincipal,data.calleSecundaria,data.referencia]
        );
        res.status(200).json({
            message: "Direccion registrada",
            direccion:rows[0]
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener las direcciones",
            error: error.message
        });
    }
}
const getAddress = async (req, res) => {
    try {
        const query = "SELECT * FROM direccion;";
        const { rows } = await pool.query(query);

        res.status(200).json({
            message: "Lista de direcciones obtenida con éxito",
            direcciones: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener las direcciones",
            error: error.message
        });
    }
};
const getAddressIdLicorera = async (req, res) => {
    const id = req.params.idLicorera;
    try {
        const query = "SELECT l.id_licorera, d.* FROM licorera l, direccion d WHERE l.id_direccion = d.id_direccion AND l.id_licorera= $1;";
        const { rows } = await pool.query(query,[id]);

        res.status(200).json({
            message: "Dirección obtenida con éxito",
            direccion: rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener la direccion",
            error: error.message
        });
    }
};

const getAddressById = async (req, res) => {
    const id = req.params.id;

    try {
        const query = "SELECT * FROM direccion WHERE id_direccion = $1;";
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Direccion no encontrada"
            });
        }

        res.status(200).json({
            message: "Direccion obtenida con éxito",
            direccion: rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener la direccion",
            error: error.message
        });
    }
};

const updateAddress = async (req, res) => {
    const id = req.params.id;
    const data = req.body;

    try {
        const query = `
            UPDATE direccion
	        SET latitud=$1, longitud=$2, calle_principal=$3, calle_secundaria=$4, referencia=$5
            WHERE id_direccion = $6 
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [
            data.latitud,
            data.longitud,
            data.calle_principal,
            data.calle_secundaria,
            data.referencia,
            id
        ]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Direccion no encontrada"
            });
        }

        res.status(200).json({
            message: "Direccion actualizada con éxito",
            direccion: rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al actualizar la Direccion",
            error: error.message
        });
    }
};

const deleteAddress = async (req, res) => {
    const id = req.params.id;

    try {
        const query = "DELETE FROM direccion WHERE id_direccion = $1 RETURNING *;";
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Direccion no encontrada"
            });
        }

        res.status(200).json({
            message: "Direccion eliminada con éxito",
            direccion: rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al eliminar la direccion",
            error: error.message
        });
    }
};
const getAddressIdUser = async (req, res) => {
    const id = req.params.idUsuario;
    try {
        const query = "SELECT du.id_direccion_usuario,du.id_usuario, d.* FROM direccion_usuario du, direccion d WHERE du.id_direccion = d.id_direccion AND du.id_usuario= $1;";
        const { rows } = await pool.query(query,[id]);

        res.status(200).json({
            message: "Lista de direcciones de usuario obtenida con éxito",
            direcciones: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener las direcciones",
            error: error.message
        });
    }
};
const createAddressUser = async (req, res)=>{
    const { idUsuario } = req.params;
    const data = req.body;
    try {
        const {rows} = await pool.query("INSERT INTO direccion(latitud, longitud, calle_principal, calle_secundaria, referencia) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [data.latitud,data.longitud,data.callePrincipal,data.calleSecundaria,data.referencia]
        );

        const addressId = rows[0].id_direccion;

        // Se asocia el usuario con la dirección
        const associateQuery = `
            INSERT INTO direccion_usuario (id_direccion, id_usuario)
            VALUES ($1, $2)
        `;
        await client.query(associateQuery, [addressId, idUsuario]);

        res.status(201).json({
            message: 'Usuario, dirección y asociación creados con éxito',
            usuario: { id_usuario: userId, ...usuario },
            direccion: { id_direccion: addressId, ...direccion }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener las direcciones",
            error: error.message
        });
    }
};

module.exports = {
    createAddress,
    getAddress,
    getAddressById,
    getAddressIdLicorera,
    updateAddress,
    deleteAddress,
    getAddressIdUser,
    createAddressUser
};