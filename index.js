const axios = require('axios');
const cheerio = require('cheerio');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');
const url = "https://www.youtube.com/channel/UCqm3BQLlJfvkTsX_hvm0UmA/videos"
let isDownloading = false;

async function scrape(){
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    console.log("Loading page...")
    await page.goto(url);

    console.log("Scraping page...")
    var href = await page.$$eval("ytd-grid-video-renderer.style-scope:nth-child("+1+") > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > h3:nth-child(1) > a:nth-child(2)", el => el.map(x => x.getAttribute("href")));

    href="https://www.youtube.com"+href;

    browser.close();
    return href;
};

async function fetchData(url){
    console.log("Fetching data...")
    // make http call to url
    let response = await axios(url).catch((err) => console.log(err));

    if(response.status !== 200){
        console.log("Error occurred while fetching data");
        return;
    }
    return response;
}

async function downloadStream(url){
    isDownloading = true;
    const cmd = `youtube-dl -o "./streams/%(title)s-%(id)s.mkv" ${url} --abort-on-unavailable-fragment`;
    exec(cmd, async (error, stdout) => {
        isDownloading = false
    });
}

function main() {
    fetchData(url).then( (res) => {
        const html = res.data;
        console.log("Channel is live: "+html.includes('{"text":" watching"}'));
        if (html.includes('{"text":" watching"}')) {
            if (isDownloading === false) {
                scrape().then((href) => {
                    console.log('Beginning download of livestream...');
                    downloadStream(href);
                });
            } else {
                console.log("Stream is downloading");
            }
        }
    })
}

setInterval(main, 6000);
