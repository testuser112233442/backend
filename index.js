const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./server/configs/index.js")
const mainRoute = require("./server/routes/main-route.js");

const promiseApp = async () => {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(express.json());
    app.use(express.text());
    app.use(express.urlencoded({ extended: true }));
    app.use(helmet());
    app.use(bodyParser.json());
    app.use(cors());
    app.use(morgan("combined"));
    app.use("/api", mainRoute);
    resolve(app);
  });
};

const promiseServer = async (app) => {
  return new Promise((resolve, reject) => {
    const server = http.Server(app);
    resolve(server);
  });
};

const promiseRun = (server) => {
  return new Promise((resolve, reject) => {
    server.listen(config.port, () => {
      console.log("Server started and listening on the port " + config.port);
      resolve();
    });
  });
};

async function initialize() {
  const app = await promiseApp();
  const server = await promiseServer(app);
  console.log("Server initialized.");
  await promiseRun(server);
}

initialize();
