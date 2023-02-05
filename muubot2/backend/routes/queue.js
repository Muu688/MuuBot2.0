const express = require('express');
const { check, validationResult } = require('express-validator');
const QueueController = require('../controllers/queue');

const router = express.Router();

router.post('/', [
  check('twitchUsername').not().isEmpty().withMessage('Twitch username is required'),
], QueueController.updateQueue);

router.post('/updateStatus', [
    check('twitchUsername').not().isEmpty().withMessage('Twitch username is required'),
  ], QueueController.updateStatus);

module.exports = router;
