/** 
  Node 8.10  
  This is part 2 of sending notifications for low utilized EC2 instances:
    1. Get data from DynamoDB for instances over 90 days 
    2. Get their tags by region
    3. Iterate over the instances in step 1 and attach their tags taken from step 2
    4. Send emails using SES
**/

// Your own constants
const tableName = 'LowUtilTable';
const awsRegion = 'us-west-2';
const emailSource = "you@email.com"; // verified
const emailTo = ["person@owner.com"];  // array of addresses

const AWS = require('aws-sdk');

AWS.config.update({
  region: awsRegion
})
