const { response } = require("express");
const pool = require("../db/db.js");

const createProducto = async (req, res) => {
    const data = req.body;

    try {
        const query = `
            INSERT INTO productos 
            (nombre, descripcion, precio_unitario, porcentaje_impuesto, precio_total, volumen_neto, estimacion, stock, imagen, id_licorera, id_categoria) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING *;
        `;
        const values = [
            data.nombre,
            data.descripcion,
            data.precio_unitario,
            data.porcentaje_impuesto,
            data.precio_total,
            data.volumen_neto,
            data.estimacion,
            data.stock,
            data.imagen,
            data.id_licorera,
            data.id_categoria
        ];

        const { rows } = await pool.query(query, values);

        res.status(201).json({
            message: "Producto registrado con éxito",
            producto: rows[0],
            response: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al registrar el producto",
            error: error.message,
            response: false
        });
    }
};

const getProductos = async (req, res) => {
    const id = req.params.idLicorera;
    try {
        const query = "SELECT p.*, ca.nombre_categoria FROM productos p, categoria ca WHERE ca.id_categoria = p.id_categoria AND p.id_licorera = $1;";
        const { rows } = await pool.query(query, [id]);

        res.status(200).json({
            message: "Lista de productos obtenida con éxito",
            productos: rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener los productos",
            error: error.message
        });
    }
};

const getProductoById = async (req, res) => {
    const id = req.params.idProducto;

    try {
        const query = "SELECT * FROM productos WHERE id_producto = $1;";
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Producto no encontrado",
                response: false
            });
        }

        res.status(200).json({
            message: "Producto obtenido con éxito",
            productos: rows,
            response: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener el producto",
            error: error.message,
            response: false
        });
    }
};
const getProductoByIdCategoria = async (req, res) => {
    const id = req.params.idCategoria;

    try {
        const query = "SELECT * FROM productos WHERE id_categoria = $1;";
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Productos no encontrados",
                response: false
            });
        }

        res.status(200).json({
            message: "Productos obtenidoa con éxito",
            productos: rows,
            response: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al obtener los productos",
            error: error.message,
            response: false
        });
    }
};
const updateProducto = async (req, res) => {
    const id = req.params.idProducto;
    const data = req.body;

    try {
        const query = `
            UPDATE productos 
            SET nombre = $1, descripcion = $2, precio_unitario = $3, porcentaje_impuesto = $4, 
                precio_total = $5, volumen_neto = $6, estimacion = $7, stock = $8, 
                imagen = COALESCE($9, imagen), id_licorera = $10, id_categoria = $11
            WHERE id_producto = $12 
            RETURNING *;
        `;
        const values = [
            data.nombre,
            data.descripcion,
            data.precio_unitario,
            data.porcentaje_impuesto,
            data.precio_total,
            data.volumen_neto,
            data.estimacion,
            data.stock,
            data.imagen,
            data.id_licorera,
            data.id_categoria,
            id
        ];

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Producto no encontrado",
                response: false
            });
        }

        res.status(200).json({
            message: "Producto actualizado con éxito",
            producto: rows[0],
            response: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al actualizar el producto",
            error: error.message,
            response: false
        });
    }
};
const deleteProducto = async (req, res) => {
    const id = req.params.id;

    try {
        const query = "DELETE FROM productos WHERE id_producto = $1 RETURNING *;";
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Producto no encontrado"
            });
        }

        res.status(200).json({
            message: "Producto eliminado con éxito",
            producto: rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error al eliminar el producto",
            error: error.message
        });
    }
};

module.exports = {
    createProducto,
    getProductos,
    getProductoById,
    getProductoByIdCategoria,
    updateProducto,
    deleteProducto
};