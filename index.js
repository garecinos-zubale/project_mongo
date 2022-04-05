const { MongoClient } = require('mongodb');
const fs = require('fs-extra');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function getBulkBatching(client) {
  const cursor = await client
    .db('quest') // stag
    // .db('heroku_31637x89') //prod
    .collection('quests')
    .aggregate([
      {
        $match: {
          'brand._id': 415,
          status: 'OPEN',
          'batching.batchId': { $exists: true },
          'pickingAndDelivery.deliveryWindowStartTime': {
            $gt: new Date('2022-03-01 06:00:00'),
          },
        },
      },
      {
        $project: {
          _id: 1,
          batching: 1,
          'brand._id': 1,
          'store.storeNumber': 1,
          'pickingAndDelivery.externalOrderId': 1,
          rewardAmount: 1,
          'pickingAndDelivery.customerInfo': 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

  const results = await cursor.toArray();
  const rows = []
  results.forEach(quest => {
      row = {
        brandId: quest.brand._id,
        storeNumber: quest.store.storeNumber,
        externalOrderId: quest.pickingAndDelivery.externalOrderId,
        batchingId: quest.batching.batchId,
        rewardAmount: quest.rewardAmount,
        clientName: quest.pickingAndDelivery.customerInfo.name,
        clientPhone: quest.pickingAndDelivery.customerInfo.phoneNumber,
        clientAdress: quest.pickingAndDelivery.customerInfo.address,
      }
      rows.push(row)
  });

  console.log(JSON.stringify(rows))

  const csvWriter = createCsvWriter({
    path: 'bulkBtahcing.csv',
    header: [
      { id: 'brandId', title: 'brandId' },
      { id: 'storeNumber', title: 'storeNumber' },
      { id: 'externalOrderId', title: 'externalOrderId' },
      { id: 'batchingId', title: 'batchingId' },
      { id: 'rewardAmount', title: 'rewardAmount' },
      { id: 'clientName', title: 'clientName' },
      { id: 'clientPhone', title: 'clientPhone' },
      { id: 'clientAdress', title: 'clientAdress' },
    ],
  });

  csvWriter
    .writeRecords(rows)
    .then(() => console.log('The CSV file was written successfully'));
}

async function main() {
  const uri =
    // Stag
    'mongodb://..';
  // Prod
  // 'mongodb://..';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    await getBulkBatching(client);
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
