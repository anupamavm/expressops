const express = require('express');
const { calculate } = require('../controllers/calculator.controller');

const router = express.Router();

router.post('/calculate', calculate);

module.exports = router;
