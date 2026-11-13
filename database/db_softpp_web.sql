DROP DATABASE IF EXISTS `db_softpp_web`;

CREATE DATABASE `db_softpp_web` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `db_softpp_web`;

-- --------------------------------------------------------
-- 1. Tablas independientes (Catálogos base y Usuarios)
-- --------------------------------------------------------

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('Administrador','Coordinador','Docente Supervisor','Supervisor de Empresa','Unidad Academica','Estudiante') NOT NULL,
  `correo` varchar(100) NOT NULL,
  `estado` tinyint(1) DEFAULT 1 COMMENT '1 = Activo, 0 = Inactivo/Pendiente',
  `primer_ingreso` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 = Primer ingreso (pide cambio clave), 0 = Ya ingresó',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `programas_estudio` (
  `id_programa` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_programa` varchar(20) NOT NULL,
  `nombre_programa` varchar(150) NOT NULL,
  `estado` tinyint(1) DEFAULT 1 COMMENT '1 = Activo, 0 = Inactivo',
  PRIMARY KEY (`id_programa`),
  UNIQUE KEY `codigo_programa` (`codigo_programa`),
  UNIQUE KEY `nombre_programa` (`nombre_programa`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `empresas` (
  `id_empresa` int(11) NOT NULL AUTO_INCREMENT,
  `ruc` varchar(20) NOT NULL,
  `razon_social` varchar(150) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo_empresa` varchar(100) DEFAULT NULL,
  `representante` varchar(100) DEFAULT NULL,
  `estado_convenio` enum('Vigente','Vencido') DEFAULT 'Vigente',
  `creado_por` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_empresa`),
  UNIQUE KEY `ruc` (`ruc`),
  KEY `fk_empresa_creador` (`creado_por`),
  CONSTRAINT `fk_empresa_creador` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Tablas dependientes de primer nivel
-- --------------------------------------------------------

CREATE TABLE `modulos` (
  `id_modulo` int(11) NOT NULL AUTO_INCREMENT,
  `id_programa` int(11) NOT NULL,
  `numero_modulo` varchar(10) NOT NULL COMMENT 'Ej: I, II, III',
  `nombre_modulo` varchar(200) NOT NULL,
  `horas_requeridas` int(11) NOT NULL DEFAULT 128,
  PRIMARY KEY (`id_modulo`),
  UNIQUE KEY `uq_programa_modulo` (`id_programa`,`numero_modulo`),
  CONSTRAINT `modulos_ibfk_1` FOREIGN KEY (`id_programa`) REFERENCES `programas_estudio` (`id_programa`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `docentes` (
  `id_docente` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `id_programa` int(11) NOT NULL COMMENT 'Programa de estudios al que pertenece el docente',
  `codigo_docente` varchar(20) NOT NULL,
  `dni` varchar(15) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  PRIMARY KEY (`id_docente`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  UNIQUE KEY `codigo_docente` (`codigo_docente`),
  UNIQUE KEY `dni` (`dni`),
  KEY `id_programa` (`id_programa`),
  CONSTRAINT `docentes_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `docentes_ibfk_2` FOREIGN KEY (`id_programa`) REFERENCES `programas_estudio` (`id_programa`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `alumnos` (
  `id_alumno` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `id_programa` int(11) NOT NULL,
  `codigo_estudiante` varchar(20) NOT NULL,
  `dni` varchar(15) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `periodo_academico` varchar(10) NOT NULL,
  `turno` enum('Diurno','Vespertino') DEFAULT 'Diurno',
  PRIMARY KEY (`id_alumno`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  UNIQUE KEY `codigo_estudiante` (`codigo_estudiante`),
  UNIQUE KEY `dni` (`dni`),
  KEY `id_programa` (`id_programa`),
  CONSTRAINT `alumnos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `alumnos_ibfk_2` FOREIGN KEY (`id_programa`) REFERENCES `programas_estudio` (`id_programa`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `supervisores_empresa` (
  `id_supervisor` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `id_empresa` int(11) NOT NULL,
  `dni` varchar(15) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `cargo` varchar(100) NOT NULL,
  `creado_por` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_supervisor`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  UNIQUE KEY `dni` (`dni`),
  KEY `id_empresa` (`id_empresa`),
  KEY `fk_supervisor_creador` (`creado_por`),
  CONSTRAINT `fk_supervisor_creador` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL,
  CONSTRAINT `supervisores_empresa_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `supervisores_empresa_ibfk_2` FOREIGN KEY (`id_empresa`) REFERENCES `empresas` (`id_empresa`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Tablas dependientes de segundo nivel
-- --------------------------------------------------------

CREATE TABLE `unidades_competencia` (
  `id_uc` int(11) NOT NULL AUTO_INCREMENT,
  `id_modulo` int(11) NOT NULL,
  `codigo_uc` varchar(20) NOT NULL COMMENT 'Ej: UC1, UC2',
  `descripcion_uc` text NOT NULL,
  PRIMARY KEY (`id_uc`),
  KEY `id_modulo` (`id_modulo`),
  CONSTRAINT `unidades_competencia_ibfk_1` FOREIGN KEY (`id_modulo`) REFERENCES `modulos` (`id_modulo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `practicantes` (
  `id_practicante` int(11) NOT NULL AUTO_INCREMENT,
  `id_alumno` int(11) NOT NULL,
  `id_docente` int(11) NOT NULL,
  `id_empresa` int(11) NOT NULL,
  `id_supervisor` int(11) DEFAULT NULL,
  `id_modulo` int(11) NOT NULL,
  `area_ejecucion` varchar(150) DEFAULT NULL COMMENT 'Ej: Oficina de Tecnologías de la Información',
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date DEFAULT NULL,
  `horas_certificadas` decimal(5,2) DEFAULT 0.00,
  `estado_folder` enum('Pendiente','Validado','Observado') DEFAULT 'Pendiente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_practicante`),
  UNIQUE KEY `uq_alumno_modulo_efsrt` (`id_alumno`,`id_modulo`),
  KEY `id_docente` (`id_docente`),
  KEY `id_empresa` (`id_empresa`),
  KEY `id_supervisor` (`id_supervisor`),
  KEY `id_modulo` (`id_modulo`),
  CONSTRAINT `practicantes_ibfk_1` FOREIGN KEY (`id_alumno`) REFERENCES `alumnos` (`id_alumno`) ON DELETE CASCADE,
  CONSTRAINT `practicantes_ibfk_2` FOREIGN KEY (`id_docente`) REFERENCES `docentes` (`id_docente`),
  CONSTRAINT `practicantes_ibfk_3` FOREIGN KEY (`id_empresa`) REFERENCES `empresas` (`id_empresa`),
  CONSTRAINT `practicantes_ibfk_4` FOREIGN KEY (`id_supervisor`) REFERENCES `supervisores_empresa` (`id_supervisor`) ON DELETE SET NULL,
  CONSTRAINT `practicantes_ibfk_5` FOREIGN KEY (`id_modulo`) REFERENCES `modulos` (`id_modulo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Tablas dependientes de tercer nivel
-- --------------------------------------------------------

CREATE TABLE `indicadores_logro` (
  `id_indicador` int(11) NOT NULL AUTO_INCREMENT,
  `id_uc` int(11) NOT NULL,
  `codigo_indicador` varchar(20) NOT NULL COMMENT 'Ej: IL1, IL2',
  `descripcion_indicador` text NOT NULL,
  PRIMARY KEY (`id_indicador`),
  KEY `id_uc` (`id_uc`),
  CONSTRAINT `indicadores_logro_ibfk_1` FOREIGN KEY (`id_uc`) REFERENCES `unidades_competencia` (`id_uc`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `asistencias_efsrt` (
  `id_asistencia` int(11) NOT NULL AUTO_INCREMENT,
  `id_practicante` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora_entrada` time NOT NULL,
  `hora_salida` time NOT NULL,
  `horas_sesion` decimal(4,2) NOT NULL,
  `actividades` text NOT NULL,
  `visto_bueno` tinyint(1) DEFAULT 0 COMMENT '0 = Pendiente, 1 = Validado',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_asistencia`),
  KEY `id_practicante` (`id_practicante`),
  CONSTRAINT `asistencias_efsrt_ibfk_1` FOREIGN KEY (`id_practicante`) REFERENCES `practicantes` (`id_practicante`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `calificaciones` (
  `id_calificacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_practicante` int(11) NOT NULL,
  `puntaje_ficha_100` decimal(5,2) NOT NULL CHECK (`puntaje_ficha_100` >= 0.00 and `puntaje_ficha_100` <= 100.00),
  `detalle_indicadores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`detalle_indicadores`)),
  `nota_final_vigesimal` decimal(4,2) NOT NULL DEFAULT 0.00,
  `escala_literal` enum('A','B','C','D') NOT NULL DEFAULT 'D',
  `apreciacion_final` varchar(30) NOT NULL DEFAULT 'Deficiente',
  `resultado` enum('Aprobado','Desaprobado') NOT NULL,
  `observaciones_supervisor` text DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id_calificacion),
  UNIQUE KEY id_practicante (id_practicante),
  CONSTRAINT calificaciones_ibfk_1 FOREIGN KEY (id_practicante) REFERENCES practicantes (id_practicante) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;    