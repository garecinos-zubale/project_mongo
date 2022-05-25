const { MongoClient } = require('mongodb');
const Promise = require('bluebird');

const Double = require('mongodb').Double;
const ObjectId = require('mongodb').ObjectId;
const axios = require('axios');

async function fixAmount(client) {
  const cursor = await client
    .db('heroku_31637x89')
    .collection('quests')
    .find({
      'brand._id': 182,
      'store._id': 2186,
      status: 'OPEN',
      'pickingAndDelivery.pickupWindowStartTime': {
        $gte: new Date('2022-05-03T00:00:00.000Z'),
      },
    });
  // .count();

  // console.log(`${JSON.stringify(cursor)}`);
  const results = await cursor.toArray();
  pendingQuests = await Promise.reduce(
    results,
    async (acc, quest) => {
      platform = { 182: 'chedraui' };

      var data = JSON.stringify({
        quest: {
          platform: platform[quest.brand._id],
          storeId: quest.store._id,
          splitType: quest.type,
          splitSplittedFlow: false,
          deliveryType: quest.type,
          distance: quest.deliveryDistance,
          lines: quest.pickingAndDelivery.orderInfo.totalLineItems,
        },
      });
      console.log(`DATA: Quest id ${quest._id} -> ${JSON.stringify(data)}`);

      var config = {
        method: 'post',
        url: 'http://localhost:8089/RewardAmount',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      };

      try {
        const response = await axios(config);
        console.log(
          `RESPONSE Quest id ${quest._id} -> ${JSON.stringify(response.data)}`
        );
        if (quest?.batching?.batchSize) {
          console.log(
            `BATCHSIZE Quest id ${JSON.stringify(
              quest._id
            )} status ${JSON.stringify(quest.status)} reward ${JSON.stringify(
              quest.rewardAmount
            )} new reward ${response.data.reward} batchSize ${
              quest.batching.batchSize
            }  totalRewardAmount ${quest.batching.totalRewardAmount}`
          );
          var obj = {
            rewardAmount: response.data.reward,
            'pickingAndDelivery.splittedFlow': false,
            'formInfo.formId': 1,
            batchId: quest.batching.batchId.split(','),
          };
          acc[quest._id] = obj;
          // console.log(acc);
          return acc;
        } else {
          console.log(
            `NO BATCHSIZE Quest id ${JSON.stringify(
              quest._id
            )} status ${JSON.stringify(quest.status)} reward ${JSON.stringify(
              quest.rewardAmount
            )} new reward ${response.data.reward} batching ${JSON.stringify(
              quest.batching
            )}`
          );
          var obj = {
            rewardAmount: response.data.reward,
            'pickingAndDelivery.splittedFlow': false,
            'formInfo.formId': 1,
          };
          acc[quest._id] = obj;
          return acc;
        }
      } catch (error) {
        console.error(error);
      }
    },
    {}
  );

  // console.log(values);
  console.log(`Quest id ${JSON.stringify(pendingQuests)}`);
  Object.entries(pendingQuests).forEach(async ([key, value]) => {
    console.log(`Quest id ${JSON.stringify(key)}   ${JSON.stringify(value)}`);
    newQuest = {};
    if (value.batchId) {
      newQuest = {
        rewardAmount: value.rewardAmount,
        'pickingAndDelivery.splittedFlow': false,
        'formInfo.formId': 1,
        'batching.totalRewardAmount': Double(
          value.batchId.reduce((acc, id) => {
            if (pendingQuests[id]) {
              rewardFt = parseFloat(pendingQuests[id].rewardAmount).toFixed(2);
              result = +parseFloat(acc).toFixed(2) + +rewardFt;
              return result;
            }
            return parseFloat(acc).toFixed(2);
          }, 0)
        ),
      };
    } else {
      newQuest = {
        rewardAmount: value.rewardAmount,
        'pickingAndDelivery.splittedFlow': false,
        'formInfo.formId': 1,
      };
    }
    console.log(`newQuest ${JSON.stringify(newQuest)}`);
    updated = await client
      .db('heroku_31637x89')
      .collection('quests')
      .updateOne(
        { _id: ObjectId(key) },
        {
          $set: newQuest,
        }
      );
    console.log(
      `UPDATED  Quest id ${JSON.stringify(key)} updated ${JSON.stringify(
        newQuest
      )}`
    );
    console.log({
      level: 'info',
      msg: `Query 2: ${updated.matchedCount} document(s) matched the filter, updated ${updated.modifiedCount} document(s)`,
    });
  });
}

async function main() {
  const uri =
    // Stag
    // 'mongodb://quest:0b1a479e0685a42f68d7d7182a101e62@35.184.128.184:27017/quest?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=false';
    // Prod
    'mongodb://..';
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    await client.connect();
    await fixAmount(client);
  } catch (error) {
    console.error(error);
  } finally {
    // await client.close();
  }
}

main().catch(console.error);
