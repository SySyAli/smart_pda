/* eslint-disable @typescript-eslint/no-explicit-any */
require('dotenv').config();
import ky from 'ky';

const R_API = process.env.R_API;
const D_API = process.env.D_API;

if (!R_API || !D_API) {
  throw new Error('API URLs are missing');
}

const resultAPI = async () => {
  const response: any = await ky
    .post(R_API, {
      json: {
        productkey: '',
        certificateNumber: '',
        rulesSpec: 'SMART',
        company: '',
        country: '',
        city: '',
        start: 0,
        recordsPerPage: 72,
        desc: false,
      },
    })
    .json();
  console.log(response);
  // validate response
  if (!response || !response.searchResults || !response.totalResults) {
    throw new Error('No data found');
  }
  return response;
};

const data = resultAPI();

// go through the data.searchResults and loop through it and call R_API and the modelCertId, and store them all together.
const resultData = async (data: any) => {
  const results = data.searchResults;
  const resultData = results.map(async (result: any) => {
    const response: any = await ky
      .post(R_API, {
        json: {
          modelCertId: result.modelCertId,
        },
      })
      .json();
    return response;
  });
  return resultData;
};

const result = resultData(data);

// store it as a csv file
const createCSV = async (data: any) => {
  const csv = require('csv-parser');
  const fs = require('fs');
  const results: any = [];
  fs.createReadStream('smart_pda_vendors.csv')
    .pipe(csv())
    .on('data', (data: any) => results.push(data))
    .on('end', () => {
      console.log(results);
    });
};

createCSV(result);
