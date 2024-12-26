const cors = require("cors");

const corsSetup = (app) => {
  // app.use(cors());
  app.use(cors({ origin: "*" }));
};

module.exports = { corsSetup };
