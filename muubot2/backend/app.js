const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const mongoose = require("mongoose");

const userRoutes = require("./routes/user");
const queueRoutes = require("./routes/queue");

const app = express();
mongoose
  .connect(`mongodb://localhost:27017/muubot`)
  .then(() => {
    console.log("DB Connection successful");
  })
  .catch((err) => {
    console.log("DB Connection has failed");
    console.log(err);
  });

// Middleware below operates first in first served. E.g. line 7 is executed before line 13.

// Set headers on the response Object
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/api/user", userRoutes);
app.use("/api/queue", queueRoutes);

module.exports = app;
