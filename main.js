const { MongoClient } = require('mongodb');
const fs = require('fs-extra');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// async function listDatabases(client) {
//   databasesList = await client.db().admin().listDatabases();
//   console.log('Databases');
//   databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
// }

async function getSplit(client) {
  const cursor = await client
    // .db('quest')
    .db('heroku_31637x89')
    .collection('quests')
    .aggregate([
      {
        $match: {
          'brand._id': 226,
          'pickingAndDelivery.splittedFlow': true,
          'store._id': 13817,
        },
      },
      {
        $project: {
          store_id: '$store._id',
          quest_id: '$_id',
          order_id: '$pickingAndDelivery.externalOrderId',
          type: '$type',
          status: '$status',
          created_at: '$createdAt'
        },
      },
      { $sort: { 'created_at': 1} },
    ]);

  const results = await cursor.toArray();

  const csvWriter = createCsvWriter({
    path: 'out0.csv',
    header: [
      { id: 'quest_id', title: 'Quest' },
      { id: 'store_id', title: 'Quest' },
      { id: 'order_id', title: 'Order' },
      { id: 'type', title: 'Type' },
      { id: 'status', title: 'Status' },
      { id: 'created_at', title: 'Created_at' },
    ],
  });

  csvWriter
    .writeRecords(results)
    .then(() => console.log('The CSV file was written successfully'));
}

async function main() {
  const uri =
    // 'mongodb://quest:0b1a479e0685a42f68d7d7182a101e62@35.184.128.184:27017/quest?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=false';
    'mongodb://..';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    // await getSplit(client);
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
