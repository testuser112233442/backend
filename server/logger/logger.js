const winston = require("winston");
const config = require("../configs/index");
const alignedWithColorsAndTime = winston.format.combine(
  winston.format.json(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.printf((info) => {
    let {
      timestamp,
      level,
      message,
      metadata: { timestamp: metaTimestamp, models, ...metadata },
    } = info;
    if (models && !Array.isArray(models)) {
      models = [models];
    }
    if (models) {
      const maskableKeys = ["password", "image"];
      models = models
        .filter((model) => !!model.toJSON)
        .map((model) => {
          var data = model.toJSON();
          maskableKeys.forEach((key) => {
            if (data[key]) data[key] = "############";
          });
          return data;
        });
      if (models.length === 1) {
        models = models[0];
      }
    }
    const ts = (timestamp || metaTimestamp).slice(0, 19).replace("T", " ");
    const payload = {
      message: message,
    };
    if (models && models.length) {
      payload.models = models;
    }
    if (metadata && Object.keys(metadata).length) {
      payload.metadata = metadata;
    }
    return `${ts} [${level}]: ${JSON.stringify(payload)}`;
  }),
  winston.format.colorize({ all: true })
);
const transports = [
  new winston.transports.Console({
    level: config.logLevel,
    format: alignedWithColorsAndTime,
  }),
];
const logger = winston.createLogger({
  level: config.logLevel,
  transports,
});
module.exports = logger;
