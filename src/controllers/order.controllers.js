const { response } = require("express");
const pool = require("../db/db.js");

const createPedido = async (req, res) => {
    const data = req.body;
    try {
        await pool.query("BEGIN");
        const pedidoQuery = `
            INSERT INTO pedido 
            (nombre_solicitante, cedula_solicitante, telefono, id_usuario, descripcion, total, fecha_emision, latitud, longitud, direccion, estado) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING *;
        `;
        const pedidoValues = [
            data.nombreSolicitante,
            data.cedulaSolicitante,
            data.telefono,
            data.idUsuario,
            data.descripcion,
            data.total_compra,
            data.fechaEmision,
            data.longitud,
            data.latitud,
            data.direccion,
            data.estado
        ];

        const pedidoResult = await pool.query(pedidoQuery, pedidoValues);
        const idPedido = pedidoResult.rows[0].id_pedido;

        const detalleQuery = `
            INSERT INTO detalle_pedido 
            (id_pedido, id_producto, cantidad, valor_unitario, subTotal, valor_iva) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *;
        `;

        for (const item of data.detalle) {
            const stockCheckQuery = "SELECT stock FROM productos WHERE id_producto = $1;";
            const stockCheckResult = await pool.query(stockCheckQuery, [item.idProducto]);

            if (stockCheckResult.rows.length === 0) {
                throw new Error(`Producto con ID ${item.idProducto} no encontrado.`);
            }

            const stockDisponible = stockCheckResult.rows[0].stock;

            if (item.cantidad > stockDisponible) {
                throw new Error(`Stock insuficiente para el producto con ID ${item.idProducto}.`);
            }

            const detalleValues = [
                idPedido,
                item.idProducto,
                item.cantidad,
                item.valorUnitario,
                item.subTotal,
                item.valorIva
            ];
            await pool.query(detalleQuery, detalleValues);

            // Se Reduce el stock del producto.
            const updateStockQuery = `
                UPDATE productos 
                SET stock = stock - $1 
                WHERE id_producto = $2;
            `;
            await pool.query(updateStockQuery, [item.cantidad, item.idProducto]);
        }

        // Confirmar la transacción.
        await pool.query("COMMIT");

        res.status(201).json({
            message: "Pedido creado con éxito",
            pedido: pedidoResult.rows[0],
            response: true
        });
    } catch (error) {
        //await client.query("ROLLBACK");
        console.error(error);
        res.status(500).json({
            message: "Error al crear el pedido",
            error: error.message,
            response: false
        });
    }
};

const getDetallesByPedidoId = async (req, res) => {
    const idPedido = req.params.idPedido;

    try {
        const query = `
            SELECT 
                dp.id_detalle,
                dp.id_pedido,
                dp.id_producto,
                p.nombre AS nombre_producto,
                dp.cantidad,
                dp.valor_unitario,
                dp.subTotal,
                dp.valor_iva
            FROM detalle_pedido dp
            INNER JOIN productos p ON dp.id_producto = p.id_producto
            WHERE dp.id_pedido = $1;
        `;

        const { rows } = await pool.query(query, [idPedido]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: `No se encontraron detalles para el pedido con ID ${idPedido}`
            });
        }

        res.status(200).json({
            message: "Detalles del pedido recuperados con éxito",
            detalles: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al obtener los detalles del pedido",
            error: err.message
        });
    }
};
const updateTotalPedido = async (req, res) => {
    const { idPedido } = req.params;
    const data = req.body;
    try {

        const queryUpdate = `
            UPDATE pedido
            SET total = $1
            WHERE id_pedido = $2
            RETURNING *;
        `;
        const { rows } = await pool.query(queryUpdate, [data.total, idPedido]);

        res.status(200).json({
            message: "Total del pedido actualizado con éxito",
            pedido: rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al actualizar el total del pedido",
            error: err.message
        });
    }
};
const getPedidosByEstadoAndLicorera = async (req, res) => {
    const { estado, idLicorera } = req.params;

    try {
        const query = `
            SELECT 
                p.id_pedido,
                p.nombre_solicitante,
                p.cedula_solicitante,
                p.telefono,
                p.descripcion,
                p.total,
                p.fecha_emision,
                p.latitud,
                p.longitud,
                p.direccion,
                p.estado,
                dp.id_detalle,
                dp.id_producto,
                dp.cantidad,
                dp.valor_unitario,
                dp.subTotal,
                dp.valor_iva,
                prod.nombre AS producto_nombre,
                prod.descripcion AS producto_descripcion,
                prod.precio_unitario AS producto_precio,
                lic.nombre AS licorera_nombre
            FROM 
                pedido p
            INNER JOIN 
                detalle_pedido dp ON p.id_pedido = dp.id_pedido
            INNER JOIN 
                productos prod ON dp.id_producto = prod.id_producto
            INNER JOIN 
                licorera lic ON prod.id_licorera = lic.id_licorera
            WHERE 
                p.estado = $1 AND lic.id_licorera = $2
            ORDER BY 
                p.fecha_emision DESC;
        `;

        const values = [estado, idLicorera];

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "No se encontraron pedidos con el estado y licorera especificados.",
                response: false
            });
        }

        const pedidos = rows.reduce((acc, row) => {
            const {
                id_pedido,
                nombre_solicitante,
                cedula_solicitante,
                telefono,
                descripcion,
                total,
                fecha_emision,
                latitud,
                longitud,
                direccion,
                estado,
                id_detalle,
                id_producto,
                cantidad,
                valor_unitario,
                subTotal,
                valor_iva,
                producto_nombre,
                producto_descripcion,
                producto_precio,
                licorera_nombre,
            } = row;

            const pedidoIndex = acc.findIndex(p => p.id_pedido === id_pedido);

            const detalle = {
                id_detalle,
                id_producto,
                cantidad,
                valor_unitario,
                subTotal,
                valor_iva,
                producto_nombre,
                producto_descripcion,
                producto_precio,
            };

            if (pedidoIndex === -1) {
                acc.push({
                    id_pedido,
                    nombre_solicitante,
                    cedula_solicitante,
                    telefono,
                    descripcion,
                    total,
                    fecha_emision,
                    latitud,
                    longitud,
                    direccion,
                    estado,
                    licorera_nombre,
                    detalles: [detalle],
                });
            } else {
                acc[pedidoIndex].detalles.push(detalle);
            }

            return acc;
        }, []);

        res.status(200).json({
            message: "Pedidos obtenidos con éxito",
            pedidos,
            response: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al obtener los pedidos",
            error: err.message,
            response: false
        });
    }
};
const getPedidoById = async (req, res) => {
    const { idPedido } = req.params;

    try {
        const query = `
            SELECT 
                p.id_pedido,
                p.nombre_solicitante,
                p.cedula_solicitante,
                p.telefono,
                p.descripcion,
                p.total,
                p.fecha_emision,
                p.latitud,
                p.longitud,
                dl.latitud AS latitud_licorera,
                dl.longitud AS longitud_licorera,
                p.direccion,
                p.estado,
                dp.id_detalle,
                dp.id_producto,
                dp.cantidad,
                dp.valor_unitario,
                dp.subTotal,
                dp.valor_iva,
                prod.nombre AS producto_nombre,
                prod.descripcion AS producto_descripcion,
                prod.precio_unitario AS producto_precio,
                lic.nombre AS licorera_nombre
            FROM 
                pedido p
            INNER JOIN 
                detalle_pedido dp ON p.id_pedido = dp.id_pedido
            INNER JOIN 
                productos prod ON dp.id_producto = prod.id_producto
            INNER JOIN 
                licorera lic ON prod.id_licorera = lic.id_licorera
            INNER JOIN
                direccion_licorera dl ON lic.id_licorera = dl.id_licorera
            WHERE 
                p.id_pedido = $1 AND dp.id_pedido = $1
            ORDER BY 
                p.fecha_emision DESC;
        `;

        const values = [idPedido];

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "No se encontraron pedidos con el estado y licorera especificados.",
                response: false
            });
        }

        const pedidos = rows.reduce((acc, row) => {
            const {
                id_pedido,
                nombre_solicitante,
                cedula_solicitante,
                telefono,
                descripcion,
                total,
                fecha_emision,
                latitud,
                longitud,
                latitud_licorera,
                longitud_licorera,
                direccion,
                estado,
                id_detalle,
                id_producto,
                cantidad,
                valor_unitario,
                subTotal,
                valor_iva,
                producto_nombre,
                producto_descripcion,
                producto_precio,
                licorera_nombre,
            } = row;

            const pedidoIndex = acc.findIndex(p => p.id_pedido === id_pedido);

            const detalle = {
                id_detalle,
                id_producto,
                cantidad,
                valor_unitario,
                subTotal,
                valor_iva,
                producto_nombre,
                producto_descripcion,
                producto_precio,
            };

            if (pedidoIndex === -1) {
                acc.push({
                    id_pedido,
                    nombre_solicitante,
                    cedula_solicitante,
                    telefono,
                    descripcion,
                    total,
                    fecha_emision,
                    latitud,
                    longitud,
                    latitud_licorera,
                    longitud_licorera,
                    direccion,
                    estado,
                    licorera_nombre,
                    detalles: [detalle],
                });
            } else {
                acc[pedidoIndex].detalles.push(detalle);
            }

            return acc;
        }, []);

        res.status(200).json({
            message: "Pedidos obtenidos con éxito",
            pedidos: pedidos[0],
            response: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al obtener los pedidos",
            error: err.message,
            response: false
        });
    }
};

const getPedidoBEstadoAndUserId = async (req, res) => {
    const { estado, idUsuario } = req.params;

    try {
        const query = `
            SELECT 
                p.id_pedido,
                p.nombre_solicitante,
                p.cedula_solicitante,
                p.telefono,
                p.descripcion,
                p.total,
                p.fecha_emision,
                p.latitud,
                p.longitud,
                dl.latitud AS latitud_licorera,
                dl.longitud AS longitud_licorera,
                p.direccion,
                p.estado,
                dp.id_detalle,
                dp.id_producto,
                dp.cantidad,
                dp.valor_unitario,
                dp.subTotal,
                dp.valor_iva,
                prod.nombre AS producto_nombre,
                prod.descripcion AS producto_descripcion,
                prod.precio_unitario AS producto_precio,
                lic.nombre AS licorera_nombre
            FROM 
                pedido p
            INNER JOIN 
                detalle_pedido dp ON p.id_pedido = dp.id_pedido
            INNER JOIN 
                productos prod ON dp.id_producto = prod.id_producto
            INNER JOIN 
                licorera lic ON prod.id_licorera = lic.id_licorera
            INNER JOIN
                direccion_licorera dl ON lic.id_licorera = dl.id_licorera
            WHERE 
                p.estado = $1 AND p.id_usuario = $2
            ORDER BY 
                p.fecha_emision DESC;
        `;

        const values = [estado, idUsuario];

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({
                message: "No se encontraron pedidos con el estado y licorera especificados.",
                response: false
            });
        }

        const pedidos = rows.reduce((acc, row) => {
            const {
                id_pedido,
                nombre_solicitante,
                cedula_solicitante,
                telefono,
                descripcion,
                total,
                fecha_emision,
                latitud,
                longitud,
                latitud_licorera,
                longitud_licorera,
                direccion,
                estado,
                id_detalle,
                id_producto,
                cantidad,
                valor_unitario,
                subTotal,
                valor_iva,
                producto_nombre,
                producto_descripcion,
                producto_precio,
                licorera_nombre,
            } = row;

            const pedidoIndex = acc.findIndex(p => p.id_pedido === id_pedido);

            const detalle = {
                id_detalle,
                id_producto,
                cantidad,
                valor_unitario,
                subTotal,
                valor_iva,
                producto_nombre,
                producto_descripcion,
                producto_precio,
            };

            if (pedidoIndex === -1) {
                acc.push({
                    id_pedido,
                    nombre_solicitante,
                    cedula_solicitante,
                    telefono,
                    descripcion,
                    total,
                    fecha_emision,
                    latitud,
                    longitud,
                    latitud_licorera,
                    longitud_licorera,
                    direccion,
                    estado,
                    licorera_nombre,
                    detalles: [detalle],
                });
            } else {
                acc[pedidoIndex].detalles.push(detalle);
            }

            return acc;
        }, []);

        res.status(200).json({
            message: "Pedidos obtenidos con éxito",
            pedidos,
            response: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al obtener los pedidos",
            error: err.message,
            response: false
        });
    }
}

const updateEstadoPedido = async (req, res) => {
    const { idPedido } = req.params;
    const data = req.body;

    try {
        const query = `
            UPDATE pedido
            SET estado = $1
            WHERE id_pedido = $2
            RETURNING *;
        `;

        const { rows } = await pool.query(query, [data.estado, idPedido]);

        res.status(200).json({
            message: "Estado del pedido actualizado con éxito",
            pedido: rows[0],
            response: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error al actualizar el estado del pedido",
            error: err.message,
            response: false
        });
    }
}

module.exports = {
    createPedido,
    getDetallesByPedidoId,
    getPedidoById,
    getPedidosByEstadoAndLicorera,
    getPedidoBEstadoAndUserId,
    updateTotalPedido,
    updateEstadoPedido
};