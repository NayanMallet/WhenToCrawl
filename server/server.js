require('dotenv').config();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js')
const axios = require('axios');

const brandsIds = {
    "adidas" : "ADIDAS",
    "a-cold-wall" : "A COLD WALL",
    "aime-leon-dore" : "AIME LEON DORE",
    "asics" : "ASICS",
    "jordan" : "AIR JORDAN",
    "bape" : "BAPE",
    "bryant-giles" : "BRYANT GILES",
    "collaborations" : "COLLABORATIONS",
    "cactus-plant-flea-market" : "CACTUS PLANT FLEA MARKET",
    "cortez" : "CORTEZ",
    "converse" : "CONVERSE",
    "clot" : "CLOT",
    "dior" : "DIOR",
    "crocs" : "CROCS",
    "eastside-golf" : "EASTSIDE GOLF",
    "joe-freshgoods" : "JOE FRESHGOODS",
    "jjjjound" : "JJJJOUND",
    "hello-kitty" : "HELLO KITTY",
    "kith" : "KITH",
    "liverpool-fc" : "LIVERPOOL FC",
    "nike" : "NIKE",
    "nocta" : "NOCTA",
    "off-white" : "OFF-WHITE",
    "pharrell-williams" : "PHARRELL WILLIAMS",
    "peaceminusone" : "PEACEMINUSONE",
    "patta" : "PATTA",
    "sacai" : "SACAI",
    "salehe-bembury" : "SALEHE BEMBURY",
    "sean-wotherspoon" : "SEAN WOTHERSPOON",
    "stussy" : "STÜSSY",
    "supreme" : "SUPREME",
    "travis-scott" : "TRAVIS SCOTT",
    "union" : "UNION",
    "yeezy" : "YEEZY",
    "new-balance" : "NEW BALANCE",
    "palace" : "PALACE",
    "puma" : "PUMA",
    "reebok" : "REEBOK",
    "youth-of-paris" : "YOUTH OF PARIS",
    "ycmc" : "YCMC",
    "vans" : "VANS",
    "undercover" : "UNDERCOVER",
}

const months = {
    "janvier" : "01",
    "février" : "02",
    "mars" : "03",
    "avril" : "04",
    "mai" : "05",
    "juin" : "06",
    "juillet" : "07",
    "août" : "08",
    "septembre" : "09",
    "octobre" : "10",
    "novembre" : "11",
    "décembre" : "12",
}

/**
 * Generate a hashcode from a string
 * @param s {string} - The string to hash
 * @returns {number} - The hashcode
 */
const hashCode = s => s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0);

// Supabase client for interacting with database
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

/**
 * Search the brands in the url
 * @param url {string} - The url to search
 * @returns {string} - The brands found
 */
function brandSearch(url) {
    let brands = ""
    for (const brand of Object.keys(brandsIds)) {
        if (url.includes(brand)) {
            if (brands === "") brands = brandsIds[brand];
            else brands += ` X ${brandsIds[brand]}`;
        }
    }
    if (brands[brands.length - 1] === "X") brands = brands.slice(0, brands.length - 2);
    return brands;
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            const distance = 100; // 100
            const maxProductCount = 20;

            let currentProductCount = document.querySelectorAll('.DropCard__CardContainer-sc-1f2e4y6-0').length;
            let timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                currentProductCount = document.querySelectorAll('.DropCard__CardContainer-sc-1f2e4y6-0').length;

                if(totalHeight >= scrollHeight || currentProductCount >= maxProductCount){
                    clearInterval(timer);
                    resolve();
                }
            }, 400); // 100
        });
    });
}


async function crawlProduct(url) {
    const res = await axios.get(url);
    const pageHTML = res.data.toString();
    const $ = cheerio.load(pageHTML);

    let product_name = $(".slug__BrandName-sc-7auole-2.eEPHFk").text();
    let product_color = $(".slug__ModelName-sc-7auole-1").first().text();

    let product_ressell = $(".slug__CardResellIndex-sc-7auole-19.ikRIsw").first().text();
    if (product_ressell === "" || product_ressell === "??" || product_ressell === "À définir")
        product_ressell = "Indice de resell bientôt disponible";

    let product_dropDate = $(".DropInfo__Text-sc-1okpqbg-4.lnoCgp").text();
    if (product_dropDate.includes("à ")) {
        product_dropDate = product_dropDate.split("à ");
        product_dropDate = `["${product_dropDate[0]}","${product_dropDate[1]}"]`;
    } else if (product_dropDate.length === 8 && product_dropDate.includes("/")) {
        product_dropDate = `["${product_dropDate}","??:??"]`;
    } else {
        let [month, year] = product_dropDate.split(" ");
        month = months[month];
        if (month === undefined || month === "")  month = "??";
        if (year === undefined || year === "") {
            year = "??";
        } else {
            year = year.slice(2);
        }
        product_dropDate = `["??/${month}/${year}","??:??"]`;
    }


    let product_skuCode = $(".slug__ModelCode-sc-7auole-4.duAgDC.important").text();
    if (product_skuCode === "À définir" || product_skuCode.includes("??")) product_skuCode = "undefined_" + hashCode(product_name + "_" + product_color);

    let product_indice_ressell = $(".slug__InfosTextImportant-sc-7auole-15.jgCfSf").text();
    if (product_indice_ressell === "" || product_indice_ressell.includes("??")) product_indice_ressell = "Indice de resell bientôt disponible";

    return {
        url: url,
        name: product_name,
        color: product_color,
        color_style: $('script').text().split("nameColor\":\"")[1].slice(0, 7),
        brand: brandSearch(url),
        ressell: product_ressell,
        img: $(".slug__ImgContainer-sc-7auole-9.jtPQUM .image").attr("style").split('url("')[1].split('")')[0],
        price: $(".DropInfo__Text-sc-1okpqbg-4.tcoxR").text().slice(13, -1),
        sku_code: product_skuCode,
        drop_date: product_dropDate,
        indice_ressell: product_indice_ressell,
    };
}


// Function who crawl all products from whentocop.fr and insert/update them in the database
(async () => {
    const browser = await puppeteer.launch({
        headless: false
    });

    const page = await browser.newPage();
    const url = "https://www.whentocop.fr/drops";
    await page.goto(url);

    await autoScroll(page);
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);

    const $ = cheerio.load(bodyHTML);
    const productPromises = $(".DropCard__CardContainer-sc-1f2e4y6-0").slice(0, 150).map(async (index, element) => {
        return await crawlProduct("https://www.whentocop.fr" + $(element).attr("href"));
    }).get();

    const crawledProducts = await Promise.all(productPromises);

    for (const product of crawledProducts) {
        const {data, error} = await supabase
            .from('products')
            .upsert([product], {onConflict: ['sku_code']});

        if (error) {
            console.error('Failed to insert/update product:', error);
        } else {
            console.log('Product inserted/updated successfully : ' + product.name + " => " + product.drop_date);
        }
    }

    await browser.close();
})();