const db = require('../config/db');
// Si usas bcrypt en tu login, descomenta la siguiente línea:
// const bcrypt = require('bcrypt');

const registrarSolicitud = async (req, res) => {
    const {
        codigo_estudiante,
        dni,
        nombres,
        apellidos,
        periodo_academico
    } = req.body;

    // 1. Validar que lleguen todos los datos
    if (!codigo_estudiante || !dni || !nombres || !apellidos || !periodo_academico) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son obligatorios.'
        });
    }

    // Obtener una conexión individual del pool para manejar la transacción
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 2. Preparar contraseña (si usas bcrypt en authController, úsalo aquí también)
        // const passwordHash = await bcrypt.hash(dni, 10);
        const passwordHash = dni; 

        // 3. Insertar automáticamente en la tabla `usuarios`
        const queryUsuario = `
            INSERT INTO usuarios (username, password_hash, rol, estado) 
            VALUES (?, ?, 'Estudiante', 'Pendiente')
        `;
        const [resultUsuario] = await connection.query(queryUsuario, [dni, passwordHash]);
        const nuevoIdUsuario = resultUsuario.insertId;

        // 4. Insertar en la tabla `alumnos` usando el id_usuario recién creado
        const queryAlumno = `
            INSERT INTO alumnos (id_usuario, codigo_estudiante, dni, nombres, apellidos, periodo_academico) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [resultAlumno] = await connection.query(queryAlumno, [
            nuevoIdUsuario,
            codigo_estudiante.trim(),
            dni.trim(),
            nombres.trim(),
            apellidos.trim(),
            periodo_academico
        ]);

        // 5. Confirmar ambos registros en MySQL
        await connection.commit();

        return res.status(201).json({
            success: true,
            message: 'Solicitud registrada. Su usuario es su DNI y su estado está Pendiente de aprobación.',
            data: {
                id_alumno: resultAlumno.insertId,
                id_usuario: nuevoIdUsuario
            }
        });

    } catch (error) {
        // Si algo falla (ej. DNI o código duplicado), deshacer todo para no dejar usuarios huérfanos
        if (connection) await connection.rollback();
        console.error('Error en transacción de registro:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'El DNI o el Código de Estudiante ya se encuentra registrado.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno al procesar el registro.'
        });
    } finally {
        // Liberar la conexión de vuelta al pool
        if (connection) connection.release();
    }
};

module.exports = {
    registrarSolicitud
};
