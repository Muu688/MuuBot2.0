const mongoose = require("mongoose");
const Queue = require("../models/queue");
const Status = require("../helper/status");

const {
  createLogger,
  format: { combine, timestamp, label, printf },
  transports,
} = require("winston");

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  format: combine(label({ label: "update-queue" }), timestamp(), myFormat),
  transports: [new transports.File({ filename: "logs/queue.log" })],
});

exports.updateQueue = async (req, res, next) => {
  try {
    const twitchUsername = req.body.twitchUsername;
    const todaysDate = new Date().toISOString().slice(0, 10);

    let queue = await Queue.findOne({ todaysDate });
    if (!queue) {
      queue = new Queue({
        date: new Date().toISOString().slice(0, 10),
        users: [
          {
            twitchUsername,
          },
        ],
      });
    } else {
      queue.users = [
        ...queue.users,
        {
          twitchUsername,
          time: new Date().toLocaleTimeString(),
        },
      ];
    }

    const savedQueue = await queue.save();

    res.status(200).json({
      success: true,
      message: `User ${twitchUsername} added to queue!`,
      savedQueue,
    });
  } catch (error) {
    logger.error(`Error when updating user: ${error}`);
    res.status(500).send("Server error");
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { twitchUsername, status } = req.body;
    const date = req.params.date || new Date().toISOString().slice(0, 10);

    const queue = await Queue.findOne({ date });
    if (!queue) {
      logger.info(`Queue for date: ${date} was not found.`);
      return res.status(404).json({
        success: false,
        message: "Queue not found",
      });
    }

    const userIndex = queue.users.findIndex(
      (user) =>
        user.twitchUsername === twitchUsername &&
        user.status === Status.IN_QUEUE
    );
    if (userIndex === -1) {
      logger.info(
        `User ${twitchUsername} not found in queue for date: ${date} or cannot be updated as the users status is in an endstate.`
      );
      logger.info(`Queue data: ${queue}`);
      return res.status(404).json({
        success: false,
        message:
          "User not found in queue or cannot be updated as the users status is in an endstate.",
      });
    }

    queue.users[userIndex].status = status;
    queue.users[userIndex].timeUpdated = new Date();

    const updatedQueue = await queue.save();

    res.status(200).json({
      success: true,
      message: "User status updated successfully!",
      queue: updatedQueue,
    });
  } catch (error) {
    logger.error(
      `An error has occurred while trying to update the status of a user. \n ${error}`
    );
    res.status(500).send("Server error");
  }
};

exports.getQueue = async (req, res) => {
  try {
    const date = req.params.date || new Date().toISOString().slice(0, 10);

    const queue = await Queue.findOne({ date });

    if (!queue) {
      logger.info(`Queue for date: ${date} was not found.`);
      return res.status(404).json({
        success: false,
        message: "Queue not found",
      });
    }

    res.status(200).json({
      success: true,
      queue,
    });
  } catch (error) {
    logger.error(
      `An error has occurred while trying to update the status of a user. \n ${error}`
    );
    res.status(500).send("Server error");
  }
};
