// Node.JS 8.10
// Create Daily Snapshots in AWS

const AWS = require('aws-sdk');
const ec2 = new AWS.EC2();

exports.handler = (event, context) => {
  const params = {
    Filters: [
      { Name: 'tag-key', Values: ['Backup', 'True'] }
    ]
  };

  ec2.describeInstances(params, (err, data) => {
    if (err) console.log(err, err.stack);
    else {
      data.Reservations.forEach((v, i) => {
        v.Instances.forEach((_, i2) => {
          createSnapshot(data.Reservations[i].Instances[i2])
        });
      });
    }
  });
};
