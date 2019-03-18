const nodeFetch = require('node-fetch');

let sites = ['https://www.httpstest.com', 'http://www.httptest.com'];

exports.handler = async (event, context, callback) => {
  try {
    const promises = sites.map(myFetch);
    let status = await Promise.all(promises);
    console.log('Status: ', status.every(v => v === 200))
  }
  catch (err) {
    callback(err.message)
  }
}

async function myFetch(url) {
  return nodeFetch(url).then(x => x.status)
  //return nodeFetch(url, {redirect: 'error'}  if dont want redirects
}
