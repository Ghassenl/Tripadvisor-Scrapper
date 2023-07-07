const puppeteer = require('puppeteer');
const fs = require('fs');

async function retrieveRestaurantUrls() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://fr.tripadvisor.be/Restaurants-g188646-Charleroi_Hainaut_Province_Wallonia.html');

  const pageUrls = await page.evaluate(() => {
    const urlArray = Array.from(document.links).map((link) => link.href);
    const uniqueUrlArray = [...new Set(urlArray)];
    return uniqueUrlArray.filter((url) => url.startsWith('https://fr.tripadvisor.be/Restaurant_Review') && !url.endsWith('#REVIEWS'));
  });

  await browser.close();
  return pageUrls;
}


async function applyExtractRestaurantInfo() {
  const urls = await retrieveRestaurantUrls();
  const output = [];

  for (let i = 0; i < 5; i++) {
    const url = urls[i];
    const restaurantInfo = await extractRestaurantInfo(url);
    output.push(restaurantInfo);
  }

  const currentDate = new Date();
  const filename = currentDate.toISOString().replace(/[-:.]/g, '').slice(0, -5) + '.json';
  const jsonString = JSON.stringify(output);

  fs.writeFile(filename, jsonString, (err) => {
    if (err) {
      console.error('Error writing JSON file:', err);
    } else {
      console.log('JSON file saved:', filename);
    }
  });
}

async function extractRestaurantInfo(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Extraction du nom du restaurant
  await page.waitForSelector('h1[data-test-target="top-info-header"].HjBfq');
  const restaurantNameElement = await page.$('h1[data-test-target="top-info-header"].HjBfq');
  const restaurantName = await page.evaluate(element => element.textContent, restaurantNameElement);

  // Extraction du numéro de téléphone
  await page.waitForSelector('span.AYHFM a.BMQDV');
  const phoneNumberElement = await page.$('span.AYHFM a.BMQDV');
  const phoneNumber = await page.evaluate(element => element.textContent, phoneNumberElement);
  
  await browser.close();

  return {
    name: restaurantName,
    phone: phoneNumber
  };
}

// Appel de la fonction applyExtractRestaurantInfo()
applyExtractRestaurantInfo();
