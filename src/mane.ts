import puppeteer from "puppeteer";
import readlineSync from "readline-sync";
import { promises as fsPromises } from "fs";
import fs from "fs";

import pkg from 'electron';
const { BrowserWindow, app } = pkg;

let win = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
        nodeIntegration: true,
        //preload: `${__dirname}/scripts/Window.js`,
    },
});

win.loadURL("https://www.fimfiction.net/");

app.on("ready", () => {
    console.log("App is ready");
});

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

async function login(page: any) {
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
        let text = await page.evaluate(
            (el: { textContent: any }) => el.textContent,
            error
        );
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
