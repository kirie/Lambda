const AWS = require('aws-sdk');
const fs = require('fs');
const TemplateName = "myTemplate";
const SubjectPart = "My Subject Title";

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
