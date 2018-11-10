'use strict';

import * as config from 'config';
import * as express from 'express';
import * as morgan from 'morgan';
import * as SwaggerExpress from '@chezearth/swagger-express-mw';

import { logger } from '../common/helpers/winston';

import { connectDb, DbClient } from '../common/db/connector';


// Node environment
const env: string = process.env.NODE_ENV || 'development';

const app: express.Application = express();


const appRoot = __dirname.substring(0, __dirname.indexOf('dist') - 1);
const swaggerConfig: SwaggerExpress.Config = {
  appRoot: appRoot  // required config
};


async function swaggerCreate(): Promise<void> {

  // start the server...
  SwaggerExpress.create(swaggerConfig, function(err, swaggerExpress) {

    if (err) { throw err; }


    // unless in test env, use morgan to log requests
    if(env !== 'test') {
      app.use(morgan(`MORGAN:remote-addr - :remote-user [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time[digits]ms` , { stream: logger }));
    }


    // install middleware
    swaggerExpress.register(app);


    // start listening
    const port: string | number = process.env.PORT || 3000;
    app.listen(port);


    // Start up message
    if(env !== 'test') logger.write(`"Server started and listening on localhost:${port}" "${env} environment"`);

  });

}


async function dBconnection(count: number): Promise<void | DbClient> {

  // Mongo DB connection. Returned as a promise which resolves quite quickly but is awaited if the connection is used.
  const url: string = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
  const dbName: string = config.get('database') || 'alarmServer';
  const wait: number = Number(config.get('database_connection_wait')) || 6000;
  const retries: number = Number(config.get('database_connection_retries')) || 10;

  if(env !== 'test') logger.write(`"Attempt ${count + 1} connecting to database: ${url}" "${env} environment"`);

  try {

    const db: DbClient = await connectDb(url, dbName, wait);

    if(env !== "test") logger.write(`"Server connected to database: ${url}" "${env} environment"`);

    // Now there is a database connection, we can call SwaggerExpress
    await swaggerCreate();

    return db;

  } catch(e) {

    if(count + 1 < retries) {
      return await dBconnection(count + 1);
    } else {
      logger.write(`"Server failed to connect to database: ${url}" "${env} environment"`, "error");
      process.exit(1);
    }

  }

}


export const mongoConn: Promise<void | DbClient> = dBconnection(0);


export default app; // for testing
