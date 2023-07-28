const puppeteer = require("puppeteer");
const readlineSync = require("readline-sync");
const fsPromises = require("fs").promises;
const fs = require("fs");
const { BrowserWindow, app, session } = require("electron");

app.on("ready", () => {
    start();
});

async function start() {
    let win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            //preload: `${__dirname}/scripts/Window.js`,
        },
    });
    if (fs.existsSync("./cookies.json")) {
        let cookies = JSON.parse(
            (await fsPromises.readFile("../cookies.json")).toString()
        );

        console.log(cookies);
        //cookies[0].url = 'https://www.fimfiction.net/'
        //session.defaultSession.cookies.set(cookies[0], (error) => {
        //    if (error) console.error(error)
        //  })
    }
    win.loadURL("https://www.fimfiction.net/");
    win.webContents.on("did-start-loading", () => {
        win.webContents.executeJavaScript(`document.cookie`).then((result) => {
            console.log(result);
        })});
    win.webContents.on("did-finish-load", () => {
        win.webContents.executeJavaScript(`
            document.querySelector('.user_toolbar > ul').innerHTML += \`<li>${sampleHTML}</li>\`;
        `);
        if (
            win.webContents.getURL() ==
            "https://www.fimfiction.net/user/237915/Silk+Rose"
        ) {
            win.webContents.executeJavaScript(`document.cookie`).then((result) => {
                console.log(result);
            });
        }
    });
}

const sampleHTML = "<p>Pinkie Pie is cute!</p>";

function getCookie() {
}

//mane();

async function mane() {
    const browser = await puppeteer.launch({
        headless: true,
        slowMo: 0,
    });
    const page = await browser.newPage();

    if (fs.existsSync("./cookies.json")) {
        const cookies = JSON.parse(
            (await fsPromises.readFile("./cookies.json")).toString()
        );
        await page.setCookie(...cookies);
    }

    await page.goto("https://www.fimfiction.net/");

    const logged_in = (await page.$('input[name="username"]')) == null;

    if (logged_in) {
        console.log("User is logged in.");
    } else {
        console.log("User is not logged in.");
        await login(page);
    }

    await page.goto("https://www.fimfiction.net/manage/stories");

    let stories = await page.evaluate(() => {
        let stories = [];
        let elements = document.getElementsByClassName("story_name");
        for (var element of elements)
            stories.push({
                id: element.outerHTML.split("/")[2],
                name: element.innerHTML,
            });
        return stories;
    });
    console.log(stories);
    await browser.close();
}

async function login(page) {
    const login_button = await page.$x("//button[contains(., 'Log In')]");
    await page.focus('input[name="username"]');
    await page.type('input[name="username"]', input_username());
    await page.waitForTimeout(1000);
    await page.focus('input[name="password"]');
    await page.type('input[name="password"]', input_password());
    await page.waitForTimeout(1000);
    await login_button[0].click();
    await page.waitForTimeout(1000);
    const success = await page.evaluate(() => {
        return !!!document.querySelector(".error-message");
    });
    if (!success) {
        await page.waitForSelector(".error-message");
        let error = await page.$(".error-message");
        let text = await page.evaluate((el) => el.textContent, error);
        console.log(text);
    } else {
        const cookies = await page.cookies();
        await fsPromises.writeFile("cookies.json", JSON.stringify(cookies));
    }
}

function input_username() {
    return readlineSync.question("Enter your username or email: ");
}

function input_password() {
    return readlineSync.question("Enter your password (hidden input): ", {
        hideEchoBack: true,
    });
}
