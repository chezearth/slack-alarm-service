"use strict";

import * as config from "config";
// import { Db, MongoClient } from "mongodb";
import * as schedule from "node-schedule";

import { getNewAlarms } from "./db/crud";
import { postSlack } from "./webhooks/slack";
import { AlarmDb } from "../common/types/docs";

import { logger } from "../common/helpers/winston";
import { connectDb, DbClient } from '../common/db/connector';


const env: string = config.util.getEnv("NODE_ENV");


schedule.scheduleJob(config.get("cron_check_alarms"), async () => {

  //myStream.write(`::ffff:127.0.0.1 - - [${(new Date()).toISOString()}] "This is the 3-second scheduled item"`);

  try {

    //call controllers/getNewAlarms
    const alarmsToSend: AlarmDb[] = await getNewAlarms(new Date());

    //webhooks/postSlack function
    if(alarmsToSend.length > 0) {

      const res: string[] = await Promise.all(alarmsToSend.map(async (e) => await postSlack(e)));

      logger.write(`"sending ${res.length} alarm messag${res.length > 1 ? 'e' : 'es'} with 'alertAt' times: ${alarmsToSend.map(alarm => alarm.alertAt)} to slack from '${config.get("slack_username")}' on the ${config.get("slack_channel")} channel" "results: ${res}"`);
    }

  } catch(e) {

    logger.write(`"${e.message}" "${e.status}"
${e.stack}`,"error")
  }

});


// Mongo DB connection. Returned as a promise which resolves quite quickly. The promise is awaited each time the connection is used
const url: string = config.get("mongoUrl") || "mongodb://127.0.0.1:27017";
const dbName: string = config.get("database") || "alarmServer";

logger.write(`"Attempting to connect to database" "${env} environment"`);

export const mongoConn: Promise<void | DbClient> = connectDb(url, dbName)
  .then(db => {

    logger.write(`"Server connected to database" "${env} environment"`)
    return db;

  })
  .catch(e => {

    logger.write(`"Server failed to connect to database" "${env} environment"`, "error");
    process.exit(1);

  });
