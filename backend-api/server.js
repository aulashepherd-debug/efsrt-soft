// backend-api/server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Configuración del Pool de Conexión a MySQL/MariaDB
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'db_softpp_web',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

// Helper para verificar rol Administrador en acciones críticas (Editar / Eliminar)
const esAdmin = (req) => req.headers['x-user-role'] === 'Administrador';

// =========================================================================
// 1. AUTENTICACIÓN Y PRIMER INGRESO
// =========================================================================

app.post('/api/auth/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ success: false, message: 'Datos incompletos.' });
  }

  try {
    const hashedPass = crypto.createHash('sha256').update(password).digest('hex');

    const [rows] = await pool.execute(
      `SELECT * FROM usuarios WHERE username = ? AND password_hash = ? AND rol = ? LIMIT 1`,
      [username.trim(), hashedPass, role]
    );

    if (rows && rows.length > 0) {
      const userObj = rows[0];

      if (userObj.estado === 0) {
        return res.status(403).json({
          success: false,
          message: 'Tu solicitud aún está Pendiente de aprobación por el Administrador.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Acceso concedido',
        id_usuario: userObj.id_usuario,
        user: userObj.username,
        role: userObj.rol,
        primer_ingreso: userObj.primer_ingreso === 1
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Usuario, contraseña o rol incorrectos.'
      });
    }
  } catch (error) {
    console.error('Error en login:', error.message);
    return res.status(500).json({ success: false, message: `Error interno: ${error.message}` });
  }
});

app.post('/api/auth/cambiar-password', async (req, res) => {
  const { id_usuario, dni_actual, nueva_password } = req.body;

  if (!id_usuario || !nueva_password) {
    return res.status(400).json({ success: false, message: 'Faltan datos obligatorios.' });
  }
  if (nueva_password.length < 6) {
    return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
  }
  if (nueva_password === dni_actual) {
    return res.status(400).json({ success: false, message: 'La nueva contraseña no puede ser igual a tu DNI.' });
  }

  try {
    const newHashedPass = crypto.createHash('sha256').update(nueva_password).digest('hex');
    await pool.execute(
      `UPDATE usuarios SET password_hash = ?, primer_ingreso = 0 WHERE id_usuario = ?`,
      [newHashedPass, id_usuario]
    );
    return res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
// 2. INSCRIPCIÓN EN LÍNEA DEL ESTUDIANTE
// =========================================================================

app.post('/api/solicitudes/registrar', async (req, res) => {
  const { id_programa, codigo_estudiante, dni, nombres, apellidos, periodo_academico, turno } = req.body;

  if (!id_programa || !codigo_estudiante || !dni || !nombres || !apellidos || !periodo_academico) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const dniLimpio = dni.trim();
    const hashedDni = crypto.createHash('sha256').update(dniLimpio).digest('hex');
    const correoInstitucional = `${dniLimpio}@institutocajas.edu.pe`;

    const [resultUsuario] = await connection.execute(
      `INSERT INTO usuarios (username, correo, password_hash, rol, estado, primer_ingreso) 
       VALUES (?, ?, ?, 'Estudiante', 0, 1)`,
      [dniLimpio, correoInstitucional, hashedDni]
    );

    const [resultAlumno] = await connection.execute(
      `INSERT INTO alumnos (id_usuario, id_programa, codigo_estudiante, dni, nombres, apellidos, periodo_academico, turno) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resultUsuario.insertId,
        id_programa,
        codigo_estudiante.trim(),
        dniLimpio,
        nombres.trim(),
        apellidos.trim(),
        periodo_academico,
        turno || 'Diurno'
      ]
    );

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: `Trámite iniciado. Tu usuario y clave inicial es tu DNI (${dniLimpio}). Estado: Pendiente de aprobación.`,
      id_alumno: resultAlumno.insertId
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'El DNI, correo institucional o Código de Estudiante ya se encuentra registrado.'
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// =========================================================================
// 3. CATÁLOGO ACADÉMICO (9 PROGRAMAS, MÓDULOS, UC E INDICADORES)
// =========================================================================

app.get('/api/programas', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM programas_estudio WHERE estado = 1 ORDER BY id_programa ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/modulos', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.*, p.nombre_programa 
      FROM modulos m
      INNER JOIN programas_estudio p ON m.id_programa = p.id_programa
      ORDER BY p.id_programa ASC, m.numero_modulo ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/curricula/:id_programa', async (req, res) => {
  const { id_programa } = req.params;
  try {
    const [modulos] = await pool.execute('SELECT * FROM modulos WHERE id_programa = ? ORDER BY numero_modulo ASC', [id_programa]);
    const [ucs] = await pool.execute(`
      SELECT uc.* FROM unidades_competencia uc
      INNER JOIN modulos m ON uc.id_modulo = m.id_modulo
      WHERE m.id_programa = ?
    `, [id_programa]);
    const [indicadores] = await pool.execute(`
      SELECT il.* FROM indicadores_logro il
      INNER JOIN unidades_competencia uc ON il.id_uc = uc.id_uc
      INNER JOIN modulos m ON uc.id_modulo = m.id_modulo
      WHERE m.id_programa = ?
    `, [id_programa]);

    res.json({ success: true, modulos, ucs, indicadores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/curricula/modulo', async (req, res) => {
  if (!esAdmin(req)) return res.status(403).json({ success: false, message: 'Solo el Administrador puede agregar módulos.' });
  const { id_programa, numero_modulo, nombre_modulo, horas_requeridas } = req.body;
  try {
    await pool.execute(
      'INSERT INTO modulos (id_programa, numero_modulo, nombre_modulo, horas_requeridas) VALUES (?, ?, ?, ?)',
      [id_programa, numero_modulo, nombre_modulo, horas_requeridas || 128]
    );
    res.status(201).json({ success: true, message: 'Módulo agregado.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/curricula/uc', async (req, res) => {
  if (!esAdmin(req)) return res.status(403).json({ success: false, message: 'Solo el Administrador puede agregar Unidades de Competencia.' });
  const { id_modulo, codigo_uc, descripcion_uc } = req.body;
  try {
    await pool.execute(
      'INSERT INTO unidades_competencia (id_modulo, codigo_uc, descripcion_uc) VALUES (?, ?, ?)',
      [id_modulo, codigo_uc, descripcion_uc]
    );
    res.status(201).json({ success: true, message: 'Unidad de Competencia agregada.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/curricula/indicador', async (req, res) => {
  if (!esAdmin(req)) return res.status(403).json({ success: false, message: 'Solo el Administrador puede agregar Indicadores.' });
  const { id_uc, codigo_indicador, descripcion_indicador } = req.body;
  try {
    await pool.execute(
      'INSERT INTO indicadores_logro (id_uc, codigo_indicador, descripcion_indicador) VALUES (?, ?, ?)',
      [id_uc, codigo_indicador, descripcion_indicador]
    );
    res.status(201).json({ success: true, message: 'Indicador de logro agregado.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
// 4. ESTUDIANTES (Solo Admin aprueba, edita y elimina)
// =========================================================================

app.get('/api/estudiantes', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, u.username, u.correo, u.estado, p.nombre_programa
      FROM alumnos a
      INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
      INNER JOIN programas_estudio p ON a.id_programa = p.id_programa
      ORDER BY a.id_alumno DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/estudiantes/:id_alumno', async (req, res) => {
  if (!esAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Solo el Administrador puede editar o aprobar estudiantes.' });
  }
  const { id_alumno } = req.params;
  const { id_usuario, id_programa, codigo_estudiante, nombres, apellidos, periodo_academico, turno, estado } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE alumnos SET id_programa = ?, codigo_estudiante = ?, nombres = ?, apellidos = ?, periodo_academico = ?, turno = ? WHERE id_alumno = ?`,
      [id_programa, codigo_estudiante, nombres, apellidos, periodo_academico, turno || 'Diurno', id_alumno]
    );

    if (estado !== undefined && id_usuario) {
      await connection.execute(`UPDATE usuarios SET estado = ? WHERE id_usuario = ?`, [estado, id_usuario]);
    }

    await connection.commit();
    res.json({ success: true, message: 'Estudiante actualizado.' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

app.delete('/api/estudiantes/:id_usuario', async (req, res) => {
  if (!esAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Solo el Administrador puede eliminar estudiantes.' });
  }
  try {
    await pool.execute('DELETE FROM usuarios WHERE id_usuario = ?', [req.params.id_usuario]);
    res.json({ success: true, message: 'Estudiante eliminado.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
// 5. DOCENTES SUPERVISORES (Solo Admin crea, edita y elimina)
// =========================================================================

app.get('/api/docentes', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, u.username, u.correo, p.nombre_programa
      FROM docentes d
      INNER JOIN usuarios u ON d.id_usuario = u.id_usuario
      INNER JOIN programas_estudio p ON d.id_programa = p.id_programa
      ORDER BY d.id_docente DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/docentes', async (req, res) => {
  if (!esAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Solo el Administrador puede registrar nuevos docentes.' });
  }
  const { id_programa, codigo_docente, dni, nombres, apellidos } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const dniLimpio = dni.trim();
    const hashedDni = crypto.createHash('sha256').update(dniLimpio).digest('hex');
    const correo = `${dniLimpio}@institutocajas.edu.pe`;

    const [resUser] = await connection.execute(
      `INSERT INTO usuarios (username, correo, password_hash, rol, estado, primer_ingreso) 
       VALUES (?, ?, ?, 'Docente Supervisor', 1, 1)`,
      [dniLimpio, correo, hashedDni]
    );

    await connection.execute(
      `INSERT INTO docentes (id_usuario, id_programa, codigo_docente, dni, nombres, apellidos) VALUES (?, ?, ?, ?, ?, ?)`,
      [resUser.insertId, id_programa, codigo_docente.trim(), dniLimpio, nombres.trim(), apellidos.trim()]
    );

    await connection.commit();
    res.status(201).json({ success: true, message: 'Docente Supervisor creado.' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

app.put('/api/docentes/:id_docente', async (req, res) => {
  if (!esAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Solo el Administrador puede editar docentes.' });
  }
  const { id_programa, codigo_docente, nombres, apellidos } = req.body;
  try {
    await pool.execute(
      'UPDATE docentes SET id_programa = ?, codigo_docente = ?, nombres = ?, apellidos = ? WHERE id_docente = ?',
      [id_programa, codigo_docente, nombres, apellidos, req.params.id_docente]
    );
    res.json({ success: true, message: 'Docente actualizado.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/docentes/:id_usuario', async (req, res) => {
  if (!esAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Solo el Administrador puede eliminar docentes.' });
  }
  try {
    await pool.execute('DELETE FROM usuarios WHERE id_usuario = ?', [req.params.id_usuario]);
    res.json({ success: true, message: 'Docente eliminado.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
// 6. EMPRESAS (Admin y Docente crean; SOLO Admin edita y elimina)
// =========================================================================

app.get('/api/empresas', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, 
        COALESCE(CONCAT(d.apellidos, ', ', d.nombres), u.username, 'Sistema') AS registrado_por
      FROM empresas e
      LEFT JOIN usuarios u ON e.creado_por = u.id_usuario
      LEFT JOIN docentes d ON u.id_usuario = d.id_usuario
      ORDER BY e.id_empresa DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/empresas', async (req, res) => {
  const rol = req.headers['x-user-role'];
  const idUsuarioCreador = req.headers['x-user-id'] || null;

  if (rol !== 'Administrador' && rol !== 'Docente Supervisor') {
    return res.status(403).json({ success: false, message: 'No autorizado para registrar empresas.' });
  }
  const { ruc, razon_social, direccion, telefono, correo_empresa, representante, estado_convenio } = req.body;
  try {
    await pool.execute(
      `INSERT INTO empresas (ruc, razon_social, direccion, telefono, correo_empresa, representante, estado_convenio, creado_por) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ruc.trim(), razon_social.trim(), direccion || '', telefono || '', correo_empresa || '', representante || '', estado_convenio || 'Vigente', idUsuarioCreador]
    );
    res.status(201).json({ success: true, message: 'Empresa registrada correctamente.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/empresas/:id_empresa', async (req, res) => {
  if (!esAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Solo el Administrador puede editar empresas.' });
  }
  const { ruc, razon_social, direccion, telefono, correo_empresa, representante, estado_convenio } = req.body;
  try {
    await pool.execute(
      `UPDATE empresas SET ruc = ?, razon_social = ?, direccion = ?, telefono = ?, correo_empresa = ?, representante = ?, estado_convenio = ? WHERE id_empresa = ?`,
      [ruc, razon_social, direccion, telefono, correo_empresa, representante, estado_convenio, req.params.id_empresa]
    );
    res.json({ success: true, message: 'Empresa actualizada.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/empresas/:id_empresa', async (req, res) => {
  if (!esAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Solo el Administrador puede eliminar empresas.' });
  }
  try {
    await pool.execute('DELETE FROM empresas WHERE id_empresa = ?', [req.params.id_empresa]);
    res.json({ success: true, message: 'Empresa eliminada.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
// 7. SUPERVISORES DE EMPRESA (Admin y Docente crean; SOLO Admin edita y elimina)
// =========================================================================

app.get('/api/supervisores', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, e.razon_social, e.ruc, u.username,
        COALESCE(CONCAT(d.apellidos, ', ', d.nombres), uc.username, 'Sistema') AS registrado_por
      FROM supervisores_empresa s
      INNER JOIN empresas e ON s.id_empresa = e.id_empresa
      INNER JOIN usuarios u ON s.id_usuario = u.id_usuario
      LEFT JOIN usuarios uc ON s.creado_por = uc.id_usuario
      LEFT JOIN docentes d ON uc.id_usuario = d.id_usuario
      ORDER BY s.id_supervisor DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/supervisores', async (req, res) => {
  const rol = req.headers['x-user-role'];
  const idUsuarioCreador = req.headers['x-user-id'] || null;

  if (rol !== 'Administrador' && rol !== 'Docente Supervisor') {
    return res.status(403).json({ success: false, message: 'No autorizado para registrar supervisores.' });
  }
  const { id_empresa, dni, nombres, apellidos, cargo } = req.body;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const dniLimpio = dni.trim();
    const hashedDni = crypto.createHash('sha256').update(dniLimpio).digest('hex');
    const correo = `sup_${dniLimpio}@empresa.efsrt.pe`;

    const [resUser] = await connection.execute(
      `INSERT INTO usuarios (username, correo, password_hash, rol, estado, primer_ingreso) 
       VALUES (?, ?, ?, 'Supervisor de Empresa', 1, 1)`,
      [dniLimpio, correo, hashedDni]
    );

    await connection.execute(
      `INSERT INTO supervisores_empresa (id_usuario, id_empresa, dni, nombres, apellidos, cargo, creado_por) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [resUser.insertId, id_empresa, dniLimpio, nombres.trim(), apellidos.trim(), cargo.trim(), idUsuarioCreador]
    );

    await connection.commit();
    res.status(201).json({ success: true, message: 'Supervisor de Empresa creado. Usuario y clave inicial: su DNI.' });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});


app.put('/api/supervisores/:id_supervisor', async (req, res) => {
  if (!esAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Solo el Administrador puede editar supervisores.' });
  }
  const { id_empresa, nombres, apellidos, cargo } = req.body;
  try {
    await pool.execute(
      'UPDATE supervisores_empresa SET id_empresa = ?, nombres = ?, apellidos = ?, cargo = ? WHERE id_supervisor = ?',
      [id_empresa, nombres, apellidos, cargo, req.params.id_supervisor]
    );
    res.json({ success: true, message: 'Supervisor actualizado.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/supervisores/:id_usuario', async (req, res) => {
  if (!esAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Solo el Administrador puede eliminar supervisores.' });
  }
  try {
    await pool.execute('DELETE FROM usuarios WHERE id_usuario = ?', [req.params.id_usuario]);
    res.json({ success: true, message: 'Supervisor eliminado.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
// 8. EXPEDIENTES EFSRT / PRACTICANTES (Solo Admin asigna y elimina)
// =========================================================================

app.get('/api/practicantes', async (req, res) => {
  const rol = req.headers['x-user-role'];
  const idUsuario = req.headers['x-user-id'];

  try {
    let whereClause = '';
    const params = [];

    // Si es Docente Supervisor, filtrar solo los estudiantes asignados a él
    if (rol === 'Docente Supervisor' && idUsuario) {
      whereClause = 'WHERE d.id_usuario = ?';
      params.push(idUsuario);
    }

    const [rows] = await pool.execute(`
      SELECT 
        p.*,
        a.codigo_estudiante, a.dni, a.nombres, a.apellidos, a.periodo_academico, a.turno,
        prog.nombre_programa,
        m.numero_modulo, m.nombre_modulo, m.horas_requeridas,
        e.ruc, e.razon_social, e.direccion AS direccion_empresa,
        CONCAT(d.apellidos, ', ', d.nombres) AS docente_nombre,
        CONCAT(s.apellidos, ', ', s.nombres) AS supervisor_nombre, s.cargo AS supervisor_cargo,
        c.puntaje_ficha_100, c.nota_final_vigesimal, c.escala_literal, c.apreciacion_final, c.resultado, c.observaciones_supervisor, c.detalle_indicadores
      FROM practicantes p
      INNER JOIN alumnos a ON p.id_alumno = a.id_alumno
      INNER JOIN programas_estudio prog ON a.id_programa = prog.id_programa
      INNER JOIN modulos m ON p.id_modulo = m.id_modulo
      INNER JOIN empresas e ON p.id_empresa = e.id_empresa
      INNER JOIN docentes d ON p.id_docente = d.id_docente
      LEFT JOIN supervisores_empresa s ON p.id_supervisor = s.id_supervisor
      LEFT JOIN calificaciones c ON p.id_practicante = c.id_practicante
      ${whereClause}
      ORDER BY p.id_practicante DESC
    `, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


app.post('/api/practicantes', async (req, res) => {
  if (!esAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Solo el Administrador puede asignar un docente y empresa al estudiante.' });
  }
  const { id_alumno, id_docente, id_empresa, id_supervisor, id_modulo, area_ejecucion, fecha_inicio } = req.body;
  try {
    await pool.execute(
      `INSERT INTO practicantes (id_alumno, id_docente, id_empresa, id_supervisor, id_modulo, area_ejecucion, fecha_inicio) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_alumno, id_docente, id_empresa, id_supervisor || null, id_modulo, area_ejecucion || '', fecha_inicio]
    );
    res.status(201).json({ success: true, message: 'Expediente EFSRT asignado correctamente.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Este estudiante ya tiene un expediente asignado para este módulo.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Visto Bueno final del Fólder por el Docente Supervisor
app.put('/api/practicantes/visto-bueno/:id_practicante', async (req, res) => {
  const rol = req.headers['x-user-role'];
  if (rol !== 'Docente Supervisor' && rol !== 'Administrador') {
    return res.status(403).json({ success: false, message: 'Solo el Docente Supervisor o Administrador puede dar el Visto Bueno al fólder.' });
  }
  try {
    await pool.execute(
      `UPDATE practicantes SET estado_folder = 'Validado' WHERE id_practicante = ?`,
      [req.params.id_practicante]
    );
    res.json({ success: true, message: 'Fólder validado con Visto Bueno docente.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/practicantes/:id_practicante', async (req, res) => {
  if (!esAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Solo el Administrador puede eliminar expedientes.' });
  }
  try {
    await pool.execute('DELETE FROM practicantes WHERE id_practicante = ?', [req.params.id_practicante]);
    res.json({ success: true, message: 'Expediente eliminado.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
// 9. ASISTENCIAS DIARIAS (Estudiante registra; Docente valida individual o TODO)
// =========================================================================

app.get('/api/asistencias/:id_practicante', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM asistencias_efsrt WHERE id_practicante = ? ORDER BY fecha ASC, hora_entrada ASC',
      [req.params.id_practicante]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/asistencias', async (req, res) => {
  const { id_practicante, fecha, hora_entrada, hora_salida, horas_sesion, actividades } = req.body;
  try {
    await pool.execute(
      `INSERT INTO asistencias_efsrt (id_practicante, fecha, hora_entrada, hora_salida, horas_sesion, actividades) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_practicante, fecha, hora_entrada, hora_salida, horas_sesion, actividades]
    );
    res.status(201).json({ success: true, message: 'Jornada registrada.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Validar una asistencia individual (Docente Supervisor / Admin)
app.put('/api/asistencias/validar/:id_asistencia', async (req, res) => {
  const { id_asistencia } = req.params;
  const { id_practicante, visto_bueno } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute('UPDATE asistencias_efsrt SET visto_bueno = ? WHERE id_asistencia = ?', [visto_bueno ? 1 : 0, id_asistencia]);

    const [suma] = await connection.execute(
      'SELECT COALESCE(SUM(horas_sesion), 0) AS total FROM asistencias_efsrt WHERE id_practicante = ? AND visto_bueno = 1',
      [id_practicante]
    );
    await connection.execute('UPDATE practicantes SET horas_certificadas = ? WHERE id_practicante = ?', [suma[0].total, id_practicante]);

    await connection.commit();
    res.json({ success: true, message: 'Asistencia actualizada.', totalHoras: suma[0].total });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// BOTÓN "VALIDAR TODO" (Docente Supervisor / Admin aprueba todas las jornadas de un estudiante)
app.put('/api/asistencias/validar-todo/:id_practicante', async (req, res) => {
  const { id_practicante } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute('UPDATE asistencias_efsrt SET visto_bueno = 1 WHERE id_practicante = ?', [id_practicante]);

    const [suma] = await connection.execute(
      'SELECT COALESCE(SUM(horas_sesion), 0) AS total FROM asistencias_efsrt WHERE id_practicante = ? AND visto_bueno = 1',
      [id_practicante]
    );
    await connection.execute('UPDATE practicantes SET horas_certificadas = ? WHERE id_practicante = ?', [suma[0].total, id_practicante]);

    await connection.commit();
    res.json({ success: true, message: 'Todas las asistencias han sido validadas.', totalHoras: suma[0].total });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// =========================================================================
// 10. PORTAL ESTUDIANTE Y PORTAL SUPERVISOR DE EMPRESA (FICHA 100 PUNTOS)
// =========================================================================

app.get('/api/estudiantes/mi-perfil/:username', async (req, res) => {
  try {
    const [alumnos] = await pool.execute(
      `SELECT a.*, u.username, u.correo, p.nombre_programa
       FROM alumnos a
       INNER JOIN usuarios u ON a.id_usuario = u.id_usuario
       INNER JOIN programas_estudio p ON a.id_programa = p.id_programa
       WHERE u.username = ? LIMIT 1`,
      [req.params.username]
    );
    if (!alumnos.length) return res.status(404).json({ success: false, message: 'Perfil no encontrado.' });

    const alumno = alumnos[0];
    const [expedientes] = await pool.execute(
      `SELECT p.*, m.numero_modulo, m.nombre_modulo, m.horas_requeridas, e.ruc, e.razon_social,
       CONCAT(d.apellidos, ', ', d.nombres) AS docente_nombre,
       c.puntaje_ficha_100, c.nota_final_vigesimal, c.escala_literal, c.apreciacion_final, c.resultado
       FROM practicantes p
       INNER JOIN modulos m ON p.id_modulo = m.id_modulo
       INNER JOIN empresas e ON p.id_empresa = e.id_empresa
       INNER JOIN docentes d ON p.id_docente = d.id_docente
       LEFT JOIN calificaciones c ON p.id_practicante = c.id_practicante
       WHERE p.id_alumno = ? ORDER BY m.numero_modulo ASC`,
      [alumno.id_alumno]
    );

    res.json({ success: true, alumno, expedientes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Obtener practicantes asignados al Supervisor de Empresa
app.get('/api/supervisor/mis-practicantes/:username', async (req, res) => {
  try {
    const [sups] = await pool.execute(
      `SELECT s.*, e.razon_social, e.ruc, e.direccion, e.telefono, e.correo_empresa, e.estado_convenio 
       FROM supervisores_empresa s
       INNER JOIN empresas e ON s.id_empresa = e.id_empresa
       INNER JOIN usuarios u ON s.id_usuario = u.id_usuario
       WHERE u.username = ? LIMIT 1`,
      [req.params.username]
    );
    if (!sups.length) return res.status(404).json({ success: false, message: 'Supervisor no encontrado.' });

    const supervisor = sups[0];
    const [practicantes] = await pool.execute(
      `SELECT p.*, a.codigo_estudiante, a.dni, a.nombres, a.apellidos, a.periodo_academico,
       prog.nombre_programa, m.numero_modulo, m.nombre_modulo, e.razon_social,
       c.puntaje_ficha_100, c.nota_final_vigesimal, c.escala_literal, c.apreciacion_final, c.resultado
       FROM practicantes p
       INNER JOIN alumnos a ON p.id_alumno = a.id_alumno
       INNER JOIN programas_estudio prog ON a.id_programa = prog.id_programa
       INNER JOIN modulos m ON p.id_modulo = m.id_modulo
       INNER JOIN empresas e ON p.id_empresa = e.id_empresa
       LEFT JOIN calificaciones c ON p.id_practicante = c.id_practicante
       WHERE p.id_supervisor = ? OR p.id_empresa = ?`,
      [supervisor.id_supervisor, supervisor.id_empresa]
    );

    res.json({ success: true, supervisor, practicantes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Calificar Ficha de 100 puntos (EXCLUSIVO DEL SUPERVISOR DE EMPRESA)
app.post('/api/evaluaciones/registrar', async (req, res) => {
  const rol = req.headers['x-user-role'];
  if (rol !== 'Supervisor de Empresa') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: Únicamente el Supervisor de Empresa puede calificar la Ficha de 100 puntos.'
    });
  }

  const { id_practicante, indicadores, observaciones_supervisor } = req.body;
  if (!id_practicante || !indicadores || Object.keys(indicadores).length !== 25) {
    return res.status(400).json({ success: false, message: 'Debe calificar los 25 indicadores (1 a 4 puntos).' });
  }

  const puntajeTotal = Object.values(indicadores).reduce((acc, val) => acc + Number(val), 0);
  const notaVigesimal = Number((puntajeTotal / 5).toFixed(2));

  let escalaLiteral = 'D';
  let apreciacionFinal = 'Deficiente';
  if (puntajeTotal >= 90) {
    escalaLiteral = 'A';
    apreciacionFinal = 'Muy Buena';
  } else if (puntajeTotal >= 75) {
    escalaLiteral = 'B';
    apreciacionFinal = 'Buena';
  } else if (puntajeTotal >= 63) {
    escalaLiteral = 'C';
    apreciacionFinal = 'Aceptable';
  }

  const resultado = puntajeTotal >= 75 ? 'Aprobado' : 'Desaprobado';

  try {
    await pool.execute(
      `INSERT INTO calificaciones 
       (id_practicante, puntaje_ficha_100, detalle_indicadores, nota_final_vigesimal, escala_literal, apreciacion_final, resultado, observaciones_supervisor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       puntaje_ficha_100 = VALUES(puntaje_ficha_100),
       detalle_indicadores = VALUES(detalle_indicadores),
       nota_final_vigesimal = VALUES(nota_final_vigesimal),
       escala_literal = VALUES(escala_literal),
       apreciacion_final = VALUES(apreciacion_final),
       resultado = VALUES(resultado),
       observaciones_supervisor = VALUES(observaciones_supervisor)`,
      [
        id_practicante,
        puntajeTotal,
        JSON.stringify(indicadores),
        notaVigesimal,
        escalaLiteral,
        apreciacionFinal,
        resultado,
        observaciones_supervisor || ''
      ]
    );

    res.status(201).json({
      success: true,
      message: `Evaluación empresarial registrada: ${puntajeTotal} pts (${escalaLiteral} - ${apreciacionFinal}) | ${resultado}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Inicialización del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor API corriendo en http://localhost:${PORT}`);
});
