 // Transform email attachment to generate file for ERP System
 
 /* eslint linebreak-style: ["error", "windows"] */

const moment = require('moment');
const XLSX = require('xlsx');
const fs = require('fs');

const ACCOUNT = 'ACCOUNT_NUM';
const HEADERstr = 'HEADER_NUM';
const SPACEPAD1 = '   ';
const SPACEPAD2 = '                         ';

// Data from S3, Dynamo, etc. import
const excelFile = 'mySpreadsheet.xls';

exports.handler = async (event, context, callback) => {
  try {
    let x = await excel(excelFile);
  }
  catch (err) {
    callback(err.message);
  }
};

async function excel () {
  const sorted = {};
  const workbook = XLSX
}
