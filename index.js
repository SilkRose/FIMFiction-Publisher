const puppeteer = require("puppeteer");

async function mane() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("https://www.fimfiction.net/story/539422/the-pink-tax");

    let likes = await page.evaluate(() => {
        const likesElement = document.querySelector(".likes");
        return likesElement.innerText;
    });

    console.log(likes + " likes on The Pink Tax.");

    await browser.close();
}

mane();
