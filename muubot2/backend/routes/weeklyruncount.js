const express = require('express');
const { check, validationResult } = require('express-validator');
const WeeklyRunCountConroller = require('../controllers/weeklyruncount');

const router = express.Router();

router.post('/', [
  check('date').not().isEmpty().withMessage('Date is required'),
  check('userCount').not().isEmpty().withMessage('userCount is required'),
], WeeklyRunCountConroller.createWeeklyRunCount);

router.get('/', WeeklyRunCountConroller.getAllWeeklyRunCounts);

// router.post('/updateStatus', [
//     check('twitchUsername').not().isEmpty().withMessage('Twitch username is required'),
//   ], QueueController.updateStatus);

module.exports = router;
