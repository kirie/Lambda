/** 
  Node 8.10  
  This is part 1 of sending notifications for low utilized EC2 instances:
    1. Retrieves Trusted Advisor EC2's with low activity
    2. Get's dynamoDB instances
    3. Diffs them removing active instances
    4. Updates Dynamo
    5. Calls Lambda to send emails with SES
**/

const AWS = require('aws-sdk');
const AWS2 = require('aws-sdk');

AWS2.config.update({
  region: 'us-west-2'
});

const tableName = 'TRUSTED_ADVISOR';
const tableKey = 'TRUSTED_ID';
const updateDays = 14;

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
