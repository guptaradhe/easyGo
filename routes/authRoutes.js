const authController = require('../controllers/authControllers')
const authMiddleware = require('../middlewares/authMiddleware')
const { body, validationResult } = require('express-validator');

const express = require('express')


const router = express.Router()

router.post('/log-in', authController.logIn)
router.get('/me',authMiddleware, authController.me)

module.exports = router