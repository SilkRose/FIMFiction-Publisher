import puppeteer from "puppeteer";
import readlineSync from "readline-sync";
import { promises as fsPromises } from "fs";
import fs from "fs";

async function mane() {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
    });
    const page = await browser.newPage();

    if (fs.existsSync("./cookies.json")) {
        const cookies = JSON.parse(
            (await fsPromises.readFile("./cookies.json")).toString()
        );
        await page.setCookie(...cookies);

        await page.waitForTimeout(1000);
    }

    await page.goto("https://www.fimfiction.net/");

    await page.waitForTimeout(1000);
    const logged_in = (await page.$('input[name="username"]')) == null;

    if (logged_in) {
        console.log("User is logged in.");
    } else {
        console.log("User is not logged in.");
        await login(page);
    }

    await page.goto("https://www.fimfiction.net/story/539422/the-pink-tax");

    let likes = await page.$eval(
        ".likes",
        (likesElement: any) => likesElement.innerText
    );

    console.log(likes + " likes on The Pink Tax.");

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
    console.log(success);
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
        console.log(cookies);
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

mane();
