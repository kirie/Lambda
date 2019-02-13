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

exports.handler = async (event, context, callback) => {
  // get all dynamoDB instances back
  let dynaInstances = await dynaDB();

  // separate by region and then 
  let regionInstances = parseDaysRegion(dynaInstances.Items);

  // iterate through all regions listed in dynamo
  let instanceTags = await Promise.all(Object.entries(regionInstances)
    .map(async ([key, value]) => {
      return await acquireTags(value, key);
    })
  )

  // merge the region tags into one object
  instanceTags = instanceTags.reduce((acc, cv) => {
    for (let key in cv) {
      acc[key] = cv[key]
    }
    return acc;
  }, {})

  // Iterate over instances over 90 days and attach their tags from instanceTags
  let email90 = dynaInstances.Items
    .filter(v => v.days >= 90 && v.days < 120)
    .map(v => {
      v['tags'] = instanceTags[v.instance]
      return v
    });

  // Iterate over instances over 120 days and attach their tags from instanceTags
  let stop120 = dynaInstances.Items
    .filter(v => v.days >= 120 && v.days < 150)
    .map(v => {
      v['tags'] = instanceTags[v.instance]
      return v
    });

  // Iterate over instances over 150 days and attach their tags from instanceTags
  let terminate150 = dynaInstances.Items
    .filter(v => v.days >= 150)
    .map(v => {
      v['tags'] = instanceTags[v.instance]
      return v
    });

  // send to SES with template message
  if (email90.length) await sesSend(email90, 1);
  if (stop120.length) await sesSend(stop120, 2);
  if (terminate150.length) await sesSend(terminate150, 3);
}

// send emails with instance types. 
// use templates later
async function sesSend(arr, ec2type) {
  const instanceCount = arr.length;
  let templateType = ''

  const SES = new AWS.SES({
    apiVersion: '2010-12-01'
  });

  switch (ec2type) {
    case 1:
      templateType = 'LowUtilizationEC2_90'
      break;
    case 2:
      templateType = 'LowUtilizationEC2_120'
      break;
    case 3:
      templateType = 'LowUtilizationEC2_150'
      break;
    default:
      templateType = 'LowUtilizationEC2_90'
  }

  const emailTemplate = {
    "Source": emailSource,
    "Template": templateType,
    "Destination": {
      "ToAddresses": [...emailTo]
    },
    "TemplateData": stringEscape({
      data: arr,
      instanceCount
    })
  }

  let sendIt = await SES.sendTemplatedEmail(emailTemplate).promise();
  console.log('Sending: ', sendIt)
};

// Escape and remove double escapes
function stringEscape(dat) {
  return JSON.stringify(dat).replace(/\\/g, '\\');
}


// take in the array of instances in each region(localRegion) and call EC2 to get the tags back
// then sort them by the instanceId into an Object
async function acquireTags(arr, localRegion) {
  const EC2instances = arr.map(v => v.instance);
  const EC2 = new AWS.EC2({ apiVersion: '2016-11-15', region: localRegion });

  let ec2Params = {
    Filters: [
      {
        Name: "resource-id",
        Values: [
          ...EC2instances
        ]
      }
    ]
  };

  let getAWSTags = await EC2.describeTags(ec2Params).promise()
  let instanceTags = arrayToObject2(getAWSTags.Tags, 'ResourceId')
  return instanceTags;
}
