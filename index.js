const { MongoClient } = require('mongodb');
var axios = require('axios');

async function fixAmount(client) {
  const cursor = await client
    .db('heroku_31637x89')
    .collection('quests')
    .find({
      rewardAmount: { $type: 'double' },
      createdAt: {
        $gte: new Date('20122-04-22T02:00:00.000Z'),
      },
    })
    .limit(61);

  const results = await cursor.toArray();
  results.forEach(async (quest) => {
    platform = { 120: 'walmart', 182: 'chedraui', 412: 'wong-peru' };

    var data = JSON.stringify({
      quest: {
        platform: platform[quest.brand._id],
        storeId: quest.store._id,
        splitType: quest.deliveryType,
        splitSplittedFlow: quest.pickingAndDelivery.splittedFlow,
        deliveryType: quest.pickingAndDelivery.deliveryType,
        distance: quest.deliveryDistance,
        lines: quest.pickingAndDelivery.orderInfo.totalLineItems,
      },
    });

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
      // console.log(JSON.stringify(response.data));
      console.log(
        `Quest id ${JSON.stringify(quest._id)} status ${JSON.stringify(
          quest.status
        )} reward ${JSON.stringify(quest.rewardAmount)} new reward ${
          response.data.reward
        }`
      );

      updated = await client
        .db('heroku_31637x89')
        .collection('quests')
        .updateOne(
          { _id: quest._id },
          {
            $set: {
              rewardAmount: response.data.reward,
            },
          }
        );
    } catch (error) {
      console.error(error);
    }
  });
}

async function main() {
  const uri =
    // Stag
    // 'mongodb://quest:0b1a479e0685a42f68d7d7182a101e62@35.184.128.184:27017/quest?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=false';
    // Prod
    'mongodb://quest:..';
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
