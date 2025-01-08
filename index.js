// ==UserScript==
// @name        better stalkchain kol feed
// @namespace   Violentmonkey Scripts
// @match       https://stalkchain.com/kol-feed
// @grant       "I need grant"
// @version     2.0
// @author      @zeusonthrone
// @description 27.12.2024, 14:02:23
// ==/UserScript==

(function() {
    'use strict';

    // Конфигурация
    const config = {
        badInfluencers: ['AkatsukiFnF', 'BroccoliYn', 'VersusFNF', 'moneymaykah_',
                        'jlad_6000', 'TheMisterFrog', '0xreubs', 'FoerdeFoerde',
                        'yelotree'] // Список нежелательных Influencers (без @)
    };

    // Функция для удаления строк
    function removeRows() {
        const rows = document.querySelectorAll('ul.flatList-items > li.flat-item');

        rows.forEach(row => {
            const influencerCell = row.querySelector('div div:nth-child(1) a[href]'); // Ячейка с Influencer

            // Получаем имя инфлюенсера без @
            const influencerName = influencerCell ? influencerCell.textContent.trim().replace('@', '') : '';

            if (config.badInfluencers.includes(influencerName)) {
                // Добавляем класс для скрытия строки
                row.style.display = 'none'; // Или используйте row.classList.add('hidden');
            }
        });
    }

    // Функция для преобразования числа в формат с сокращением (K, M, B)
    function formatNumberToShort(value) {
        if (value >= 1_000_000_000) {
            return (value / 1_000_000_000).toFixed(2) + 'B'; // Миллиарды
        } else if (value >= 1_000_000) {
            return (value / 1_000_000).toFixed(2) + 'M'; // Миллионы
        } else if (value >= 1_000) {
            return (value / 1_000).toFixed(0) + 'K'; // Тысячи
        } else {
            return value.toString(); // Оставляем как есть для чисел < 1000
        }
    }

    // Функция для добавления столбца MKT CAP
    function addMarketCapRows() {
        const rows = document.querySelectorAll('ul.flatList-items > li.flat-item');

        rows.forEach(row => {
            // Проверяем, есть ли уже столбец MKT CAP для текущей строки
            const mainDiv = row.querySelector('div')
            if (mainDiv.querySelector('div.mkt-cap')) {
                return; // Пропускаем строки, где уже есть MKT CAP
            }
            const priceCell = mainDiv.querySelector('div:nth-child(6)'); // Ячейка с Price (4-й столбец)
            const marketCapCell = document.createElement('div');
            marketCapCell.className = 'mkt-cap';
            const tokenLink = mainDiv.querySelector('div:nth-child(3) > div > div > a.inline-flex').href;
            const tokenAddress = tokenLink.split('/').pop(); // Берём последний сегмент пути (адрес токена)
            const lastFourChars = tokenAddress.slice(-4).toLowerCase();
            if (lastFourChars === 'pump') {
                const price = parseFloat(priceCell.textContent.trim().replace('$', '').replace(',', '')); // Получаем значение Price
                const marketCap = isNaN(price) ? 'N/A' : formatNumberToShort(price * 1_000_000_000); // Вычисляем MKT CAP
                marketCapCell.innerText = `${marketCap}`; // Добавляем значение
            } else {
                marketCapCell.innerText = 'NOT PF'; // Если данных нет
            }

            mainDiv.appendChild(marketCapCell); // Добавляем ячейку в строку
        });
    }

    // Запускаем процесс удаления и добавления ссылок периодически
    setInterval(() => {
        try {
            removeRows();
            addMarketCapRows();
        } catch (error) {
            console.error('Ошибка в процессе выполнения скрипта:', error);
        }
    }, 1000); // Каждую секунду проверяем таблицу
})();