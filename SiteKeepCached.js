const url = require('url');

let sites = ['https://www.google.com', 'http://www.google.com'];

exports.handler = async (event, context, callback) => {
  try {
    const promises = sites.map(getSite); \\ hmm....
    await Promise.all(promises);
  }
  catch (err) {
    callback(err.message)
  }
};

async function getSite(siteUrl) {
  let url = url.parse(siteUrl);
  let proto = require(urlObj.protocol.slice(0, urlObj.protocol.length - 1));
  
  let req = proto.request(urlObj, (res) => {
    let body = '';
    console.log(res.statusCode);
    res.setEncoding('utf8')
    res.on('data', (chunk) => {
      body+=chunk.toString();
    })
    res.on('end', () => {
      console.log(body);
      callback();
    })
  })
  
  res.on('end', function() {
    //console.log(body);
    callback();
  });  
  
  res.on('end', function() {
    //console.log(body);
    callback();
  });
  
  return new Promise((resolve, reject) => {
    \\ if 200 or 300 code resolve
    \\ reject
  }
}
