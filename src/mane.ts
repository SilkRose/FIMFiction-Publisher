import puppeteer from "puppeteer";

async function mane() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto("https://www.fimfiction.net/");

    const loginLink = (await page.$('input[name="username"]')) !== null;

    if (loginLink) {
        console.log("User is not logged in.");
        await login(page);
    } else {
        console.log("User is logged in.");
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
    await page.focus('input[name="username"]');

    await page.type('input[name="username"]', "Test");

    await page.waitForTimeout(3000);

    const enteredUsername = await page.$eval(
        'input[name="username"]',
        (input: { value: any; }) => input.value
    );

    console.log("Entered Username:", enteredUsername);
}

mane();
