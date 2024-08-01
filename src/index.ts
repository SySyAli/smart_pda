/* eslint-disable @typescript-eslint/no-explicit-any */
require('dotenv').config();
import ky from 'ky';
// eslint-disable-next-line n/no-unsupported-features/node-builtins
import {promises as fs} from 'fs';
import {parse} from 'json2csv';

const R_API = process.env.R_API;
const D_API = process.env.D_API;

if (!R_API || !D_API) {
  throw new Error('API URLs are missing');
}

const TIMEOUT = 5000; // 5 seconds timeout

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
      timeout: TIMEOUT,
    })
    .json();

  // console.log(response);

  // Validate response
  if (!response || !response.searchResults || !response.totalResults) {
    throw new Error('No data found');
  }
  return response;
};

resultAPI();

const resultData = async (data: any) => {
  const results = data.searchResults;

  const resultDataPromises = results.map(async (result: any) => {
    const response: any = await ky
      .post(D_API, {
        json: {
          modelCertId: result.modelCertId,
        },
        timeout: TIMEOUT,
      })
      .json();
    return {...result, ...response};
  });

  // Wait for all promises to resolve
  const resultData = await Promise.all(resultDataPromises);
  return resultData;
};

const createCSV = async (data: any) => {
  try {
    const csv = parse(data);
    await fs.writeFile('smart_pda_vendors.csv', csv);
    console.log('CSV file created successfully.');
  } catch (error) {
    console.error('Error creating CSV file:', error);
  }
};

const main = async () => {
  try {
    const initialData = await resultAPI();
    const detailedData = await resultData(initialData);
    await createCSV(detailedData);
  } catch (error) {
    console.error('Error:', error);
  }
};

main();
