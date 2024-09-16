/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    chrome: {
        skipDownload: false, // Download Chrome (this is the default)
    },
    firefox: {
        skipDownload: false, // Download Firefox (default is true, so we're changing it to false)
    },
    cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
