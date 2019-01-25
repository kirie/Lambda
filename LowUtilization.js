/** 
  Node 8.10  
  This is part 1 of sending notifications for low utilized EC2 instances:
    1. Retrieves Trusted Advisor EC2's with low activity
    2. Get's dynamoDB instances
    3. Diffs them removing active instances
    4. Updates Dynamo
    5. Calls Lambda to send emails with SES
**/

const tableName = 'LowUtilTable';
const tableKey = 'LowUtilId';
const updateDays = 14;
const region = 'us-west-2';

const AWS = require('aws-sdk');
const AWS2 = require('aws-sdk');

AWS2.config.update({ 
  region
});

const support = new AWS.Support({region: 'us-east-1'});
const dynaClient = new AWS2.DynamoDB.DocumentClient();
const lambda = new AWS2.Lambda();

exports.handler = async (event, context, callback) => {
  try {
    // get TA and Dynamo DB so we can process them
    let instances = await getTrustedInstances();

    let dynamo = await dynaDB();

    // Filter and Update instances
    let lowUtil = filterUpdateActive(dynamo.Items, instances);

    //Remove now Active instances from Dynamo
    await removeActive(lowUtil.remove);

    // Update instances in Dynamo
    let updatedDynamo = await replaceItems(lowUtil.lowUtilObj);

    // Call next Lambda function
    await callPart2(updatedDynamo);
  }
  catch (err) {
    callback(err.message)
  }
};


// remove any instance in dynamo that is now in active use.
async function removeActive(obj) {
  await Promise.all(Object.entries(obj).map(async ([key, value]) => {
    const delParams = {
      TableName: tableName,
      Key: {
        [tableKey] : key
      }
    }
    await dynaClient.delete(delParams).promise();
  }))
};


// update items in dynamo with the newly updated instances
async function replaceItems (obj) {
  await Promise.all(Object.entries(obj).map(async ([key, value]) => {
    const updated = {
      TableName: tableName,
      Item: {
        ...value,
        [tableKey]: key,
      }
    }
    await dynaClient.put(updated).promise();
    })
  )
};


// Get existing instances from DynamoDB
async function dynaDB() {
  const scanParams = {
    "TableName": tableName
  };

  const dynamoData = await dynaClient.scan(scanParams).promise();
  return dynamoData;
}

// invoke lambda
async function callPart2(newDB) {
  const lambdaParams = {
    FunctionName: "LowUtilizationEC2_SES",
    InvocationType: "RequestResponse",
    LogType: "Tail",
    Payload: JSON.stringify(newDB)
  };
  let callLambda = await lambda.invoke(lambdaParams).promise();
}


// Convert array to object with a selected Key.  Like Lodash _.mapKeys
function arrayToObject(arr, key) {
  return arr.reduce((acc, cv) => {
    acc[cv[`${key}`]] = cv;
    return acc;
  }, {});
}
