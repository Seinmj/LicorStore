const pool = require("../db/db.js");

const createCategoria = async (req, res) => {
    const data = req.body;
    const query = "INSERT INTO categoria(nombre_categoria, descripcion,id_licorera) VALUES ($1, $2, $3) RETURNING *";
    try {
        const { rows } = await pool.query(query,
            [data.nombreCategoria, data.descripcion, data.idLicorera]
        );
        res.status(200).json({
            message: "Categoria registrada",
            categoria: rows[0],
            response: true
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al crear la categoria",
            error: error.message,
            response: false
        });
    }
}

const getCategorias = async (req, res) => {
    const id = req.params.idLicorera;
    try {
        const query = "SELECT * FROM categoria WHERE id_licorera=$1;";
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Categorias no encontradas",
                response: false
            });
        } else {
            res.status(200).json({
                message: "Lista de categorias obtenida con éxito",
                categorias: rows,
                response: true
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener las categorias",
            error: error.message,
            response: false
        });
    }
};

const updateCategoria = async (req, res) => {
    const id = req.params.idCategoria;
    const data = req.body;

    try {
        const query = `
            UPDATE categoria
            SET nombre_categoria= $1, descripcion=$2, id_licorera=$3
            WHERE id_categoria = $4
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [
            data.nombreCategoria,
            data.descripcion,
            data.idLicorera,
            id
        ]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Categoria no encontrada"
            });
        }

        res.status(200).json({
            message: "Categoria actualizada con éxito",
            licorera: rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al actualizar la categoria",
            error: error.message
        });
    }
};

const deleteCategoria = async (req, res) => {
    const id = req.params.idCategoria;

    try {
        const query = "DELETE FROM categoria WHERE id_categoria = $1 RETURNING *;";
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Categoria no encontrada"
            });
        }

        res.status(200).json({
            message: "Categoria eliminada con éxito",
            licorera: rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al eliminar la Categoria",
            error: error.message
        });
    }
};
module.exports = {
    createCategoria,
    deleteCategoria,
    getCategorias,
    updateCategoria
}