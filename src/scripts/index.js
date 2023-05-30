// require('dotenv').config();
import { createClient } from '@supabase/supabase-js'

// Supabase client for interacting with database
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
function getProductDate(dropDate) {
    const [datePart, timePart] = dropDate.replace('["', '').replace('"]', '').split('","');
    let [day, month, year] = datePart.split('/');
    let date = null;

    if (timePart && timePart !== "??:??") {
        const [hours, minutes] = timePart.split(':');
        day = (day === '??') ? null : day;
        date = new Date(`20${year}`, month - 1, day || 1, hours, minutes);
    } else {
        day = (day === '??') ? null : day;
        date = new Date(`20${year}`, month - 1, day || 1);
    }

    return { date, noDay: day === null };
}
async function displayProducts() {
    const { data, error } = await supabase
        .from('products')
        .select();

    if (error) {
        console.error('Error:', error);
        return;
    }

    data.sort((a, b) => {
        const aData = getProductDate(a.drop_date);
        const bData = getProductDate(b.drop_date);

        // Si les années sont différentes, triez par année.
        if (aData.date.getFullYear() !== bData.date.getFullYear()) {
            return aData.date.getFullYear() - bData.date.getFullYear();
        }

        // Si les mois sont différents, triez par mois.
        if (aData.date.getMonth() !== bData.date.getMonth()) {
            return aData.date.getMonth() - bData.date.getMonth();
        }

        // Si l'un a un jour et l'autre non, l'article avec un jour vient en premier.
        if (aData.noDay !== bData.noDay) {
            return aData.noDay ? 1 : -1;
        }

        // Sinon, triez par jour.
        return aData.date.getDate() - bData.date.getDate();
    });


    const dropContainer = document.getElementById('dropContainer');
    let currentGroupKey = null;
    let dateDiv = null;

    data.forEach(product => {
        if (product.drop_date) {
            const productDate = getProductDate(product.drop_date);

            let [datePart, timePart] = product.drop_date.replace('["', '').replace('"]', '').split('","');
            let [day, month, year] = datePart.split('/');
            console.log('Product data:', product.drop_date, productDate, datePart, timePart, day, month, year);

            const groupKey = `${year}-${month}-${productDate.noDay ? '??' : day}`;

            if (groupKey !== currentGroupKey) {
                currentGroupKey = groupKey;

                dateDiv = document.createElement('div');
                dateDiv.className = 'dateSep';
                const dateH2 = document.createElement('h2');

                const options = { year: 'numeric', month: 'long' };
                if (!productDate.noDay) {
                    options.day = 'numeric';
                }
                dateH2.textContent = productDate.date.toLocaleDateString('fr-FR', options);

                dateDiv.appendChild(dateH2);
                dropContainer.appendChild(dateDiv);
            }

            const productDiv = document.createElement('div');
            productDiv.className = 'lineProduct';
            const productTitle = document.createElement('p');
            productTitle.className = 'productTitle';
            const divContainer = document.createElement('div');
            divContainer.className = 'productContainer';
            const productInfo = document.createElement('div');
            productInfo.className = 'productInfo';
            const dateText = document.createElement('p');
            dateText.className = 'dateText';
            const retailPrice = document.createElement('p');
            retailPrice.className = 'retailPrice';



            const ProductImg = document.createElement('img');
            ProductImg.className = 'productImg';
            const ProductColor = document.createElement('h2');
            ProductColor.className = 'ProductColor';
            const moreInfoContainer = document.createElement('div');
            moreInfoContainer.className = 'moreInfoContainer';
            const moreInfoTextBox = document.createElement('div');
            moreInfoTextBox.className = 'moreInfoTextBox';
            const animatedBar = document.createElement('div');
            animatedBar.className = 'animatedBar';
            const indiceRessell = document.createElement('p');
            indiceRessell.className = 'indiceRessell';
            const divNivRessell = document.createElement('div');
            divNivRessell.className = 'divNivRessell';
            const colorNivRessell = document.createElement('div');
            colorNivRessell.className = 'colorNivRessell';
            const nivRessell = document.createElement('p');
            nivRessell.className = 'nivRessell';
            animatedBar.style.backgroundColor = product.color_style;

            productTitle.textContent = product.name;
            dateText.textContent = datePart + ' ' + timePart;
            retailPrice.textContent = "Prix retail: " + product.price + "€";
            indiceRessell.textContent = product.indice_ressell;
            nivRessell.textContent = product.ressell;
            colorNivRessell.style.backgroundColor = (product.ressell === "mauvais resell") ? "#ff0000" : (product.ressell === "moyen resell") ? "#FF9900" : (product.ressell === "bon resell") ? "#00FFB0" : (product.ressell === "excellent resell") ? "#5D19FF" : ("grey");
            ProductImg.src = product.img;
            ProductColor.textContent = product.color;
            ProductColor.style.color = product.color_style;

            productDiv.appendChild(divContainer);
            divContainer.appendChild(productInfo);
            divContainer.appendChild(moreInfoContainer);
            moreInfoContainer.appendChild(animatedBar);
            moreInfoContainer.appendChild(moreInfoTextBox);
            moreInfoTextBox.appendChild(indiceRessell);

            moreInfoTextBox.appendChild(divNivRessell);
            divNivRessell.appendChild(colorNivRessell);
            divNivRessell.appendChild(nivRessell);


            divContainer.appendChild(ProductImg);
            productInfo.appendChild(productTitle);
            productInfo.appendChild(ProductColor);
            productInfo.appendChild(dateText);
            productInfo.appendChild(retailPrice);



            const currentDate = new Date();

            // Créez une nouvelle date sans heure pour chaque produit et la date actuelle
            const productDateNoTime = new Date(productDate.date.getFullYear(), productDate.date.getMonth(), productDate.date.getDate());
            const currentDateNoTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

            // Comparez ces nouvelles dates qui n'incluent pas l'heure
            if (productDateNoTime < currentDateNoTime) {
                productDiv.classList.add('notactive');
            } else {
                productDiv.classList.add('active');
            }

            dateDiv.appendChild(productDiv);
            console.log("product added : ", product.name);
        } else {
            console.warn('drop_date is missing for product:', product);
        }
    });
    displayProductsType('new');
}

let type = 'new';

document.getElementById('newDropsButton').addEventListener('click', () => {
    type = 'new';
    displayProductsType(type);
});

document.getElementById('postDropsButton').addEventListener('click', () => {
    type = 'post';
    displayProductsType(type);
});

const Search = document.getElementById('search');
const Brand = document.getElementById('selectBrand');
const Price = document.getElementById('selectPrice');

function productMatchesSearch(productDiv, searchValue) {
    const productTitle = productDiv.querySelector('.productTitle').textContent.toLowerCase();
    const productColor = productDiv.querySelector('.ProductColor').textContent.toLowerCase();
    return productTitle.includes(searchValue) || productColor.includes(searchValue);
}

function productMatchesPrice(productDiv, priceValue) {
    const resellLevel = productDiv.querySelector('.nivRessell').textContent.toLowerCase();
    return priceValue === 'tous' || resellLevel.includes(priceValue);
}

function productMatchesBrand(productDiv, brandValue) {
    const productTitle = productDiv.querySelector('.productTitle').textContent.toLowerCase();
    return brandValue === 'tous' ||
        (brandValue === 'collaborations' && productTitle.includes(' x ')) ||
        productTitle.includes(brandValue);
}

function displayProductsType(type) {
    Search.value = '';
    Brand.value = 'tous';
    Price.value = 'tous';

    if (type === 'new') {
        document.getElementById('newDropsButton').className = 'active';
        document.getElementById('postDropsButton').className = '';
    } else {
        document.getElementById('newDropsButton').className = '';
        document.getElementById('postDropsButton').className = 'active';
    }

    document.querySelectorAll('.dateSep').forEach(dateDiv => {
        let itemsHidden = 0;

        dateDiv.querySelectorAll('.lineProduct').forEach(productDiv => {
            const isActive = productDiv.classList.contains('active');
            if ((type === 'new' && isActive) || (type === 'post' && !isActive)) {
                productDiv.style.display = 'flex';
            } else {
                productDiv.style.display = 'none';
                itemsHidden++;
            }
        });

        if (dateDiv.querySelectorAll('.lineProduct').length === itemsHidden) {
            dateDiv.style.display = 'none';
        } else {
            dateDiv.style.display = 'block';
        }
    });
}



displayProducts();



function applyFilters() {
    document.querySelectorAll('.dateSep').forEach(dateDiv => {
        let itemsHidden = 0;

        dateDiv.querySelectorAll('.lineProduct').forEach(productDiv => {
            const isActive = productDiv.classList.contains('active');
            if ((type === 'new' && isActive) || (type === 'post' && !isActive)) {
                productDiv.style.display = 'flex';
            } else {
                productDiv.style.display = 'none';
                itemsHidden++;
            }
        });

        if (dateDiv.querySelectorAll('.lineProduct').length === itemsHidden) {
            dateDiv.style.display = 'none';
        } else {
            dateDiv.style.display = 'block';
        }
    });
    let searchValue = Search.value.toLowerCase().trim();
    let brandValue = Brand.value.toLowerCase().trim();
    let priceValue = Price.value.toLowerCase().trim();

    document.querySelectorAll('.dateSep').forEach(dateDiv => {
        let itemsHidden = 0;

        dateDiv.querySelectorAll('.lineProduct').forEach(productDiv => {
            let productTitle = productDiv.querySelector('.productTitle').textContent.toLowerCase();
            let productColor = productDiv.querySelector('.ProductColor').textContent.toLowerCase();
            let resellLevel = productDiv.querySelector('.nivRessell').textContent.toLowerCase();

            let matchesSearch = productTitle.includes(searchValue) || productColor.includes(searchValue);
            let matchesBrand = brandValue === 'tous' || (brandValue === 'collaborations' && productTitle.includes(' x ')) || productTitle.includes(brandValue);
            console.log("priceValue : ", priceValue, " => ", resellLevel.includes(priceValue));
            let matchesPrice = priceValue === 'tous' || resellLevel.includes(priceValue);

            if (matchesSearch && matchesBrand && matchesPrice && productDiv.style.display !== 'none') {
                productDiv.style.display = 'flex';
            } else {
                productDiv.style.display = 'none';
                itemsHidden++;
            }
        });

        if (dateDiv.querySelectorAll('.lineProduct').length === itemsHidden) {
            dateDiv.style.display = 'none';
        } else {
            dateDiv.style.display = 'block';
        }
    });
}

Price.addEventListener('change', applyFilters);
Brand.addEventListener('change', applyFilters);
Search.addEventListener('input', applyFilters);