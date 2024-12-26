const express = require("express");
//DB Connection
require("./db");
//Morgan
const { morganSetup } = require("./morgan");
//Cors
const { corsSetup } = require("./cors");
//Compression
const compression = require("compression");

const appMiddlewares = (app) => {
  app.use(express.json());
  app.use(compression());
  corsSetup(app);
  morganSetup(app);
};

module.exports = { appMiddlewares };
