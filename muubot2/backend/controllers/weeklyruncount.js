const WeeklyRunCount = require("../models/WeeklyRunCount");
const { createLogger, format: { combine, timestamp, label, printf }, transports } = require("winston");

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  format: combine(label({ label: "update-user" }), timestamp(), myFormat),
  transports: [new transports.File({ filename: "logs/weeklyruncount.log" })],
});

exports.createWeeklyRunCount = async (req, res) => {
  const weekending = new Date(req?.body?.weekending);

  // Check if date is a Wednesday
  const dayOfWeek = weekending.getDay();
  if (dayOfWeek !== 3) {
    logger.warn("Date entered in the 'weekending' field is not a Wednesday. Since reset is a Wednesday it must be a Wednesday.");
    return res.status(400).json({
      message: "Date must be a Wednesday.",
    });
  }

  try {
    const weeklyRunCount = new WeeklyRunCount({
      weekending,
      userCount: req.body.userCount,
    });
    await weeklyRunCount.save();
    return res.status(201).json({
      message: "Weekly run count created successfully.",
      weeklyRunCount,
    });
  } catch (error) {
    logger.error(`An error has occurred while creating a weekly run count: \n ${error}`);
    return res.status(500).json({
      message: "Error creating weekly run count.",
      error,
    });
  }
};

exports.getAllWeeklyRunCounts = async (req, res) => {
  try {
    const weeklyRunCounts = await WeeklyRunCount.find();
    return res.status(200).json({
      message: "Weekly run counts retrieved successfully.",
      weeklyRunCounts,
    });
  } catch (error) {
    logger.error(`An error has occurred while reading weekly run counts: \n ${error}`);
    return res.status(500).json({
      message: "Error retrieving weekly run counts.",
      error,
    });
  }
};

exports.getWeeklyRunCount = async (req, res) => {
  return res.status(500).json({message: "This function is yet to be added. Please hassle Muu688 if you're that keen on it"})
  // try {
  //   const weeklyRunCount = await WeeklyRunCount.findById(req.params.id);
  //   if (!weeklyRunCount) {
  //     return res.status(404).json({
  //       message: "Weekly run count not found.",
  //     });
  //   }
  //   return res.status(200).json({
  //     message: "Weekly run count retrieved successfully.",
  //     weeklyRunCount,
  //   });
  // } catch (error) {
  //   return res.status(500).json({
  //     message: "Error retrieving weekly run count.",
  //     error,
  //   });
  // }
};
