'use strict';

import {
  Db,
  WriteOpResult,
  DeleteWriteOpResultObject
} from 'mongodb';

import { mongoConn } from '../../api/server';
import { AlarmDb } from '../../common/types/docs'
import { getDb } from '../../common/db/connector'


// CRUD operations
export async function create(col: string, doc: AlarmDb): Promise<AlarmDb> {

  try {

    const db: Db = await getDb(mongoConn);
    const res: WriteOpResult = await db
      .collection(col)
      .insertOne(doc);

    return res.ops['0'];

  } catch(e) {

    return Promise.reject(e);

  }

}


export async function getMany(col, query, projection, sort): Promise<AlarmDb[]> {

  try {

    const db: Db =  await getDb(mongoConn);

    const results: AlarmDb[] = await db
      .collection(col)
      .find(query, projection)
      .sort(sort)
      .toArray();

    return results;

  } catch(e) {

    return Promise.reject(e);

  }

}


export async function getOne(col, id: string, otherQueryParams: any, projection: any): Promise<AlarmDb> {

  try {

    const db: Db = await getDb(mongoConn);

    const opQuery: any = Object.assign({ _id: id }, otherQueryParams);
    const result: AlarmDb = await db
      .collection(col)
      .findOne(opQuery);

    return result;

  } catch(e) {

    return Promise.reject(e);

  }
}


// Only used to check if data already exists
export async function getCount(col, query): Promise<number> {

  try {

    const db: Db = await getDb(mongoConn);

    const num: number = await db
      .collection(col).find(query).count();

    return num;

  } catch(e) {

    return Promise.reject(e);

  }
}


// Only used for clearing data in the tests (not routed)
export async function deleteAll(col: string): Promise<DeleteWriteOpResultObject['result']> {

  try {

    const db: Db = await getDb(mongoConn);

    const res: DeleteWriteOpResultObject = await db
      .collection(col)
      .deleteMany({})

    return res.result;

  } catch(e) {

    return Promise.reject(e);

  }
}
