const express = require("express");
const AppRoutes = require("./api");
const colors = require("./loaders/colors");
const config = require("./config");
const { appMiddlewares } = require("./loaders");
const { errorHandler } = require("./middlewares/errorHandler");
const { error404 } = require("./services/helpers/errors");
const app = express();

//Loaders
require("dotenv").config();

//Setup middlewares
appMiddlewares(app);

//Initial route
app.get("/", (req, res) => {
  res.send("Initial route running...");
});

//API Routes
app.use("/crm/api/v1", AppRoutes);

//404 Error Handling for Unknown Routes
app.use((req, res) => {
  return error404(res, "Route not found");
});

// Centralized Error Handling Middleware
app.use(errorHandler);

//Starting server
async function startServer() {
  app
    .listen(config.port, () => {
      console.log(
        colors.fg.cyan,
        `
      ########################################
      🛡️  Server is listening on port: ${config.port}  🛡️
      ########################################
      `,
        colors.reset
      );
    })
    .on("error", (err) => {
      console.log("Server starting error: ", err);
      process.exit(1);
    });
}

startServer();
