const config = require("config");
const mongoose = require("mongoose");

const db = config.get("mongoURI");

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log("Database Connected ...");
  } catch (err) {
    console.error(err.message);
    // instruct node to terminate the process synchronously
    // exit with failure
    process.exit(1);
  }
};

module.exports = connectDB;
