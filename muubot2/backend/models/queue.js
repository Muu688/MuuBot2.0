const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const queueSchema = mongoose.Schema({
  date: { type: Date, default: Date.now },
  users: [
    {
      twitchUsername: { type: String, required: true },
      status: {
        type: String,
        required: false,
        enum: ["In Queue", "Done", "AFK", "Did Not Complete", "Other"],
        default: "In Queue"
      },
      timeUpdated: { type: Date, default: Date.now }
    }
  ]
});

queueSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Queue", queueSchema);
