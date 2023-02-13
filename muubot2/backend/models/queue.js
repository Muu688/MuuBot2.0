const mongoose = require("mongoose");
const Status = require("../helper/status");
const uniqueValidator = require("mongoose-unique-validator");

const queueSchema = mongoose.Schema({
  // Todo ensure that date is unique, maybe in controller.
  date: { type: Date, default: Date.now },
  listresets: { type: Number, default: 0 },
  users: [
    {
      twitchUsername: { type: String, required: true },
      status: {
        type: String,
        required: false,
        enum: [Status.IN_QUEUE, Status.DONE, Status.AFK, Status.DID_NOT_COMPLETE, Status.OTHER, Status.UNQUEUED],
        default: "In Queue"
      },
      timeUpdated: { type: Date, default: Date.now }
    }
  ]
});

queueSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Queue", queueSchema);
