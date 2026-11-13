INSERT INTO usuarios (username, password_hash, rol, correo, estado, primer_ingreso, created_at) VALUES
('Admin', SHA2('tecnocajas', 256), 'Administrador', 'aula.shepherd@gmail.com', 1, 0, '2026-11-13 15:08:39');

INSERT INTO programas_estudio (id_programa, codigo_programa, nombre_programa, estado) VALUES
(1, 'AA', 'Asistencia Administrativa', 1),
(2, 'DPW', 'Diseño y Programación Web', 1),
(3, 'EI', 'Electricidad Industrial', 1),
(4, 'ELI', 'Electrónica Industrial', 1),
(5, 'MMP', 'Mantenimiento de Maquinaria Pesada', 1),
(6, 'MPI', 'Mecánica de Producción Industrial', 1),
(7, 'MA', 'Mecatrónica Automotriz', 1),
(8, 'MET', 'Metalurgia', 1),
(9, 'TAQ', 'Tecnología de Análisis Químico', 1);

INSERT INTO empresas (id_empresa, ruc, razon_social, direccion, telefono, correo_empresa, representante, estado_convenio, creado_por) VALUES
(1, '10454476935', 'MONTESSORI SCHOOL S.A.C.', 'AV.Mariscalcastilla 233,San Aguatin de Cajas', '907147090', 'Jessenicsalvatierratacuri@gmail.com', '', 'Vigente', NULL),
(2, '20607197432', 'Corporaciones e Inversiones J&M', 'Jr. Baldeon Nro. 315 Junin - Huancayo - Huancayo', '967067040', 'coloniamezajose@gmail.com', '', 'Vigente', NULL),
(3, '20612216275', 'IESA', 'Av. Mariscal Castilla N.º 192,San Agustin de Cajas 12100', '985999557', 'sanagustin22c@yahoo.es', '', 'Vigente', NULL),
(4, '10211334504', 'Shepherd Group', 'Jr. Junín 1380 El Tambo', '123456789', 'qatunas@gmail.com', '', 'Vigente', NULL);

INSERT INTO modulos (id_modulo, id_programa, numero_modulo, nombre_modulo, horas_requeridas) VALUES
(1, 2, 'I', 'Diseño Web y Aplicaciones Multimedia', 128),
(2, 2, 'II', 'Desarrollo de Software y Gestión de Base de Datos', 128),
(3, 2, 'III', 'Gestión de Aplicaciones para Internet y Producción Multimedia', 128);
