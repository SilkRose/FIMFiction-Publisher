import puppeteer, { Page } from "puppeteer";
import readlineSync from "readline-sync";
import { promises as fsPromises } from "fs";
import fs from "fs";

const submit_selector =
    '<a data-click="submit"><i class="fa fa-cloud-upload"></i> Submit</a>';
const publish_chapter_selector =
    '<span class="chapter_publish"><i class="fa fa-upload"></i> Publish</span>';
const unpublished_chapter_selector =
    '<i class="fa fa-circle" title="Not Published" style="color:red;"></i>';
const revoke_submission_selector =
    '<a class="button-revoke-story" data-click="revoke"><i class="fa fa-reply"></i> Revoke Submission </a>';
const popout_confirm_selector =
    '<button id="ok_button" class="styled_button"><i class="fa fa-check"></i> Ok</button>';
const popout_cancel_selector =
    '<button id="cancel_button" class="styled_button styled_button_red"><i class="fa fa-times"></i>  Cancel</button>';

async function mane() {
    const browser = await puppeteer.launch({
        headless: "new",
    });
    const page = await browser.newPage();

    await check_cookies(page);

    await page.goto("https://www.fimfiction.net/");

    await check_login(page);

    await page.goto("https://www.fimfiction.net/manage/stories");

    const stories = await get_story_data(page);

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

async function check_cookies(page: Page) {
    if (fs.existsSync("./cookies.json")) {
        const cookies = JSON.parse(
            (await fsPromises.readFile("./cookies.json")).toString()
        );
        await page.setCookie(...cookies);
    }
}

async function check_login(page: Page) {
    const logged_in = (await page.$('input[name="username"]')) == null;
    if (logged_in) {
        console.log("User is logged in.");
    } else {
        console.log("User is not logged in.");
        await login(page);
    }
}

async function get_story_data(page: Page) {
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
    for (let story of stories) {
        await page.goto("https://www.fimfiction.net/story/" + story.id, {
            waitUntil: "networkidle2",
        });
        const published = await page
            .$eval(submit_selector, () => false)
            .catch(() => true);
        console.log(published, story.name);
    }
    return stories;
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
