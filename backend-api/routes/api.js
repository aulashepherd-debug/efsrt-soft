const express = require('express');
const router = express.Router();
const efsrtController = require('../controllers/efsrtController');

router.post('/solicitudes/registrar', efsrtController.registrarSolicitud);

module.exports = router;
