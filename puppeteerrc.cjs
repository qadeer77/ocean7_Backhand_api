/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    chrome: {
        skipDownload: false, 
    },
    firefox: {
        skipDownload: false, 
    },
    cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
