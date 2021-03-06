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
const emailLambda = 'LowUtilization2';
      
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


// Get a list of low utilization EC2's from Trusted Advisor, structure into an object and return
async function getTrustedInstances() {
  let data = {};

  const supportParams = {
    checkId: 'Qch7DwouX1', // Qch7DwouX1 is the Check ID for TA. https://aws.amazon.com/premiumsupport/ta-iam/
    language: 'en'
  };

  const instanceSupport = await support.describeTrustedAdvisorCheckResult(supportParams).promise();
  instanceSupport.result.flaggedResources.forEach((v) => {
    let day = parseInt(v.metadata.splice(-1, 1)[0].split(' ')[0]);
    data[v.metadata[1]] = {
      isSuppressed: v.isSuppressed,
      resourceId: v.resourceId,
      region: v.metadata[0],
      name: v.metadata[2],
      instance: v.metadata[1],
      size: v.metadata[3],
      cost: v.metadata[4],
      cpu: parseFloat(v.metadata[19].replace('%', ''), 10),
      networkio: parseFloat(v.metadata[20].replace('MB', ''), 10),
      days: day
    };
  })
  return data;
}


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
    FunctionName: emailLambda,
    InvocationType: "RequestResponse",
    LogType: "Tail",
    Payload: JSON.stringify(newDB)
  };
  let callLambda = await lambda.invoke(lambdaParams).promise();
}


// Remove all instances that are now active(we are left with valid lowUtil instances that we must keep in the DB)
function filterUpdateActive(arrDB, objTA) {
  const remove = [];

  // Filter out and save any instance found in Dynamo that isnt in Trusted Advisor.  
  const lowUtilEC2 = arrDB.filter(v => {
    if(!(v[tableKey] in objTA)){
      remove.push(v)
      return false;
    }
    return v[tableKey] in objTA
  });

  const lowUtilObj = arrayToObject(lowUtilEC2, tableKey);

  // add # of days, average out cpu/io, and update any naming, etc to the active instances 
  Object.entries(lowUtilObj).map(([key, value]) => {
    lowUtilObj[key].cpu = average(value.cpu, objTA[key].cpu);
    lowUtilObj[key].networkio = average(value.networkio, objTA[key].networkio);
    lowUtilObj[key].days = value.days + updateDays;
    lowUtilObj[key].name = value.name;
    lowUtilObj[key].size = value.size;
  });

  // add any new TA instances to the main EC2 Object
  Object.entries(objTA).forEach(([key, value]) => {
    if(!(key in lowUtilObj)) {
      lowUtilObj[key] = value;
    }
  });

  // return back two objects.  One with low Utilization and the other an Object of instances to remove from Dynamo
  return {lowUtilObj, remove: arrayToObject(remove, tableKey)};
}

// Input for CPU is 1 decimal place, but we save to 2 decimal places and return as number.
function average(float1, float2) {
  return parseFloat(((float1 + float2)/2).toFixed(2), 10);
}


// Convert array to object with a selected Key.  Like Lodash _.mapKeys
function arrayToObject(arr, key) {
  return arr.reduce((acc, cv) => {
    acc[cv[`${key}`]] = cv;
    return acc;
  }, {});
}
