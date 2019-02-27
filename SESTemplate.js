const AWS = require('aws-sdk');
const fs = require('fs');
const TemplateName = "myTemplate";
const SubjectPart = "My Subject Title";
const sourceEmail = "me@domain.com"; // Your AWS source email you have setup and verified
const emailDestination = ["you@company.com", "you2@company.com"]; //Array of addresses to send to

AWS.config.update({
  region: 'us-west-2'
})

// Load new 
const readFile = filePath => new Promise((resolve, reject) => {
  fs.readFile('./email.html', 'utf8', (err, data) => {
    if (err) reject(err);
    else resolve(data)
  })
})

async function makeTemplate() {
  const SES = new AWS.SES({
    apiVersion: '2010-12-01'
  });

  // read the email File

  const templateParams = {
    Template: {
      TemplateName,
      SubjectPart,
      HtmlPart: await readFile()
    }
  }

  let makeT = await SES.createTemplate(templateParams).promise();
  console.log('Updated Template', makeT)
}

async function sendTemplate(objdata) {
  const SES = new AWS.SES({
    apiVersion: '2010-12-01'
  })

  const emailTemplate = {
    "Source": sourceEmail,
    "Template": TemplateName,
    "Destination": {
      "ToAddresses": [...emailDestination]
    },
    "TemplateData": stringEscape(objdata)
  }
  const sending = await SES.sendTemplatedEmail(emailTemplate).promise()
  console.log('Sending template: ', sending);
}

