const { default: mongoose } = require("mongoose");
const config = require("../config/index");

const dbLoader = async () => {
  const dbUrl = config.dbUrl;
  const db = dbUrl;

  try {
    await mongoose.connect(db, {
      autoIndex: true,
    });
    console.log(`Connected to ${db} 👌`);
    mongoose.connection.on("disconnected", () => {
      console.log(`Disconnected from ${db} ❗`);
    });
    mongoose.connection.on("error", (err) => {
      console.error(`DB Connection Error: ${err.message} 🛑`);
    });
    process.on("SIGINT", () => {
      mongoose.connection.close(() => {
        console.log("Disconnected gracefully due to application termination");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error(`DB Connection Error: ${error.message} 🛑`);
    throw error;
  }
};

dbLoader();
