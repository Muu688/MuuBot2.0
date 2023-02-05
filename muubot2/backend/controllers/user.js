const { createLogger, format: { combine, timestamp, label, printf }, transports } = require("winston");

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  format: combine(label({ label: "update-user" }), timestamp(), myFormat),
  transports: [new transports.File({ filename: "logs/user-update.log" })],
});

const User = require("../models/user");

const handleError = (err, res, logger) => {
  if (err.name === "ValidationError") {
    logger.warn(`Validation error when updating user: ${err.message}`);
    res.status(400).json({ message: "Validation Error: " + err.message });
  } else {
    logger.error(`Error when updating user: ${err.message}`);
    res.status(500).json({ message: "Server Error: " + err.message });
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const twitchUsername = req.body.twitchUsername;

    let user = await User.findOne({ twitchUsername });
    if (!user) {
      user = new User({ twitchUsername, runHistory: [], secondRunCount: 0 });
    } else {
      user.secondRunCount = req?.body?.addSecondRun ? user.secondRunCount + 1 : user.secondRunCount;
      user.runHistory = req?.body?.addRun ? [...user.runHistory, new Date().toLocaleDateString()] : user.runHistory;
    }

    const result = await user.save();
    res.status(201).json({
      message: "User created!",
      result,
    });
  } catch (err) {
    handleError(err, res, logger);
  }
};

exports.getUser = async (req, res, next) => {
  const twitchUsername = req.params.twitchUsername;

  try {
    const user = await User.findOne({ twitchUsername });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    logger.error(`Error retrieving user data: ${err.message}`);
    res.status(500).json({ message: "Server Error: " + err.message });
  }
};

exports.allUsers = async (req, res, next) => {
  try {
    let users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    logger.error(`Error retreiving user data`);
    res.status(500).json({ message: "Server Error: " + err.message });
  }
};
