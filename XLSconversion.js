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
  const workbook = XLSX.readFile(excelFile);
  const firstSheet = workbook.SheetNames[0];
  const theExcel = workbook.Sheets[firstSheet];
  const arrExcel = sheet2arr(theExcel);

  // Verify the total and numbers
  if (verifyTotal(arrExcel)) {
    const items = arrExcel.slice(0, arrExcel.length - 1);

    // Split the items by date and insert into 1 Object
    items.forEach((v) => {
      sorted[v[4]] = sorted[v[4]] ? [...sorted[v[4]], v] : [v];
    });

    // iterate over the object for items sorted by date paid
    Object.entries(sorted).forEach(([key, value]) => {
      processData(key, value);
    });
  }
 
  //return ...
}


function processData(key, val) {
  const startDate = moment(key, 'MM/DD/YY').format('YYYYMMDD');
  const stream = fs.createWriteStream(`${startDate}Wells`);

  const begin = HEADERstr + startDate;
 
 // Add windows CRLF
  stream.write(`${begin}\r\n`); 

  const shortDate = startDate.slice(2);

  val.forEach((v) => {
    const amountPaid = removeCommas(v[3]);
    const padded = padEleven(removeDecimal(amountPaid));
    const line = ACCOUNT + shortDate + v[0] + SPACEPAD1 + padded + SPACEPAD2 + startDate;

    stream.write(`${line}\r\n`);
    console.log(line);
  });

  stream.end();
 
  //return  
}

//async function change
function sheet2arr(sheet) {
  const result = [];
  let row;
  let rowNum;
  let colNum;
  const end = (sheet['!ref']).split(':')[1];
  const myRef = 'A10:' + end;
  const range = XLSX.utils.decode_range(myRef);

  for (rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
    row = [];
    for (colNum = range.s.c; colNum <= range.e.c; colNum++) {
      const nextCell = sheet[XLSX.utils.encode_cell({ r: rowNum, c: colNum })];
      if (typeof nextCell !== 'undefined') {
        row.push(nextCell.w);
      }
    }
    if (row.length > 0) {
      result.push(row);
    }
  }
  return result;
}


function verifyTotal(sheet) {
  const items = sheet.slice(0, sheet.length - 1);
  console.log('Total Items: ', items.length);

  const total = removeCommas(sheet[sheet.length - 1][0]) * 100;
  console.log('Listed Total: ', total);

  const itemTotal = items.reduce((pv, cv) => {
    const amount = Number(cv[3].replace(/,/g, '')) * 100;
    return pv + amount;
  }, 0)

  console.log('Tabulated Total: ', itemTotal);
  console.log('Same total: ', itemTotal == total);

  return itemTotal == total;
}


const removeCommas = str => Number(str.replace(/,/g, ''));

const removeDecimal = num => (num * 100).toFixed(0);

const padEleven = (amt) => {
  let returnVal;
  if (amt <= 99999999999) {
    returnVal = ('00000000000' + amt).slice(-11);
  }
  return returnVal;
};
