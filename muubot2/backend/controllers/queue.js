const mongoose = require("mongoose");
const Queue = require("../models/queue");
const Status = require("../helper/status");
const TwitchUser = require("../models/user");

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
    let todaysDate = new Date();

    // check if today is not a Wednesday
    if (todaysDate.getDay() !== 3) {
      // find the next Wednesday
      let nextWednesday = new Date(todaysDate);
      nextWednesday.setDate(
        todaysDate.getDate() + ((3 - todaysDate.getDay() + 7) % 7)
      );
      todaysDate = nextWednesday.toISOString().slice(0, 10);
    } else {
      todaysDate = todaysDate.toISOString().slice(0, 10);
    }

    let queue = await Queue.findOne({ todaysDate });

    if (!queue) {
      queue = new Queue({
        date: todaysDate,
        users: [
          {
            twitchUsername,
          },
        ],
      });
    } else if (await canQueue(queue, twitchUsername)) {
      queue.users = [
        ...queue.users,
        {
          twitchUsername,
          time: new Date().toLocaleTimeString(),
        },
      ];
    } else {
      return res.status(500).json({
        success: false,
        message: `User ${twitchUsername} is already in queue or has exceeded their runs`,
      });
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
    let date = req.params.date || new Date().toISOString().slice(0, 10);
    let currentDay = new Date(date).getUTCDay();
    if (currentDay !== 3) {
      let daysUntilNextWednesday = (3 - currentDay + 7) % 7;
      date = new Date(
        new Date(date).getTime() + daysUntilNextWednesday * 86400000
      )
        .toISOString()
        .slice(0, 10);
    }
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

async function canQueue(queue, twitchUsername) {
  let hasExceededWeeklyRunsCheck;
  try {
    let user = await TwitchUser.findOne({ twitchUsername });
    if (!user) {
      user = new TwitchUser({ twitchUsername });
      user.save();
    }

    const isAlreadyInQueue = queue.users.some(
      (user) =>
        user.twitchUsername === twitchUsername &&
        user.status === Status.IN_QUEUE
    );

    const twitchUsernameCount = await countUsernameStatus(
      twitchUsername,
      queue
    );

    const hasExceededWeeklyRuns = twitchUsernameCount >= queue.listresets + 1;
    if (hasExceededWeeklyRuns && !user.secondRunCount > 0) {
      hasExceededWeeklyRunsCheck = true;
    } else if (!isAlreadyInQueue) {
      // Update the users second run count by subtracting it, as it is implicit that they want to use their second run.
      // This logic could be moved out of there to the calling function (updateQueue)
      hasExceededWeeklyRunsCheck = false;
      user.secondRunCount = user.secondRunCount - 1;
      await user.save();
    }

    return !isAlreadyInQueue && !hasExceededWeeklyRunsCheck;
  } catch (err) {
    logger.error(`Error checking if user can queue ${err.message}`);
    return false;
  }
}

async function countUsernameStatus(username, queue) {
  let count = 0;

  if (!queue) {
    return count;
  }

  queue.users.forEach((user) => {
    if (
      user.twitchUsername === username &&
      (user.status === Status.AFK ||
        user.status === Status.DONE ||
        user.status === Status.DID_NOT_COMPLETE)
    ) {
      count++;
    }
  });

  return count;
}
