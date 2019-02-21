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


function createSnapshot(instance) {
  const volumes = getVolumes(instance.BlockDeviceMappings);
  const retention = getTag(instance.Tags, 'Retention');
  volumes.forEach(v => {
    const volparams = {
      volumeId: v,
      Description: getTag(instance.Tags, 'Department')
    };
    ec2.createSnapshot(volparams, (err, data) => {
      if (err) console.log(err, err.stack)
      else {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(retention));
        tagSnapshot(data.SnapshotId, formatDate(date));
      }
    });
  });
}

function getVolumes(volumeBlock) {
  const volumes = [];
  volumeBlock.forEach(v => {
    volumes.push(v.Ebs.VolumeId);
  });
  return volumes;
}

function getTag(tags, key) {
  for (let x of tags) {
    if (x.Key == key) {
      return x.Value;
    }
  }
  return false;
}
