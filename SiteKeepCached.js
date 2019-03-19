const nodeFetch = require('node-fetch');

let sites = ['https://www.google.com', 'http://www.gogle.com'];

exports.handler = async (event, context, callback) => {
  try {
    const promises = sites.map(myFetch);
    let status = await Promise.all(promises);
    console.log('Status: ', status.every(v => v === 200));
  }
  catch (err) {
    callback(err.message);
  }
}

async function myFetch(url) {
  return nodeFetch(url).then(x => x.status)
  //return nodeFetch(url, {redirect: 'error'}).then(x => x.status)  no redirects
}
