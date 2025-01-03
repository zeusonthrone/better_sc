// ==UserScript==
// @name        better stalkchain kol feed
// @namespace   Violentmonkey Scripts
// @match       https://app.stalkchain.com/app/kol-feed
// @grant       none
// @version     1.1
// @author      @zeusonthrone
// @description 27.12.2024, 14:02:23
// ==/UserScript==

(function() {
    'use strict';

    // Конфигурация
    const config = {
        onlyBuy: false, // Удалять строки с Sell, если true
        badInfluencers: ['AkatsukiFnF', 'BroccoliYn', 'VersusFNF', 'moneymaykah_',
                        'jlad_6000', 'TheMisterFrog', '0xreubs', 'FoerdeFoerde'] // Список нежелательных Influencers (без @)
    };

    // Функция для удаления строк
    function removeRows() {
        const table = document.getElementById('kolTransactionsTable');
        const rows = table.querySelectorAll('tbody tr') // Выбираем все строки таблицы

        rows.forEach(row => {
            const typeCell = row.querySelector('td:nth-child(2)'); // Ячейка с Type
            const influencerCell = row.querySelector('td:nth-child(1)'); // Ячейка с Influencer

            // Получаем имя инфлюенсера без @
            const influencerName = influencerCell ? influencerCell.textContent.trim().replace('@', '') : '';

            // Удаляем строку, если:
            // 1. onlyBuy включён и тип Sell
            // 2. Или Influencer в списке badInfluencers
            if (
                (config.onlyBuy && typeCell && typeCell.textContent.trim().toLowerCase() === 'sell') ||
                (config.badInfluencers.includes(influencerName))
            ) {
                row.remove(); // Удаляем строку
            }
        });
    }

    // Функция для превращения имени Influencer в ссылку
    function linkifyInfluencers() {
        const table = document.getElementById('kolTransactionsTable');
        const rows = table.querySelectorAll('tbody tr') // Выбираем все строки таблицы

        rows.forEach(row => {
            const influencerCell = row.querySelector('td:nth-child(1)'); // Ячейка с Influencer
            if (influencerCell) {
                const influencerName = influencerCell.textContent.trim().replace('@', ''); // Убираем @
                const link = `https://x.com/${influencerName}`; // Формируем ссылку
                influencerCell.innerHTML = `<a href="${link}" target="_blank">${influencerCell.textContent.trim()}</a>`; // Превращаем текст в ссылку
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

    // Функция для замены ссылок в столбце Token
    function updateTokenLinks() {
        const table = document.getElementById('kolTransactionsTable');
        const rows = table.querySelectorAll('tbody tr'); // Все строки, кроме заголовка
        for (const row of rows) {
            const tokenCell = row.querySelector('td:nth-child(3)'); // Ячейка с Token
            const tokenLink = tokenCell.querySelector('a'); // Ссылка внутри ячейки
            const url = new URL(tokenLink.href); // Парсим URL
            const tokenAddress = url.pathname.split('/').pop(); // Берём последний сегмент пути (адрес токена)
            //console.log(`Обработка токена: ${tokenAddress}`); // Логируем токен в консоль

            // Заменяем ссылку на новый URL
            const newLink = `https://gmgn.ai/sol/token/${tokenAddress}`;
            tokenLink.href = newLink; // Меняем href
            tokenLink.target = '_blank'; // Открывать в новой вкладке

            if (!row.querySelector('td.mkt-cap')) {
                const priceCell = row.querySelector('td:nth-child(6)'); // Ячейка с Price (4-й столбец)
                const marketCapCell = document.createElement('td');
                marketCapCell.className = 'mkt-cap align-middle';
                const lastFourChars = tokenAddress.slice(-4).toLowerCase();
                if (lastFourChars === 'pump') {
                    const price = parseFloat(priceCell.textContent.trim().replace('$', '').replace(',', '')); // Получаем значение Price
                    const marketCap = isNaN(price) ? 'N/A' : formatNumberToShort(price * 1_000_000_000); // Вычисляем MKT CAP
                    marketCapCell.innerText = `${marketCap}`; // Добавляем значение
                } else {
                    marketCapCell.style.whiteSpace = 'nowrap';
                    marketCapCell.innerText = 'NOT PF'; // Если данных нет
                }

                row.appendChild(marketCapCell); // Добавляем ячейку в стро
            }
        }
    }

    // Функция для добавления столбца MKT CAP
    function addMarketCapRows() {
        const rows = []
        rows.forEach(row => {
            // Проверяем, есть ли уже столбец MKT CAP для текущей строки
            if (row.querySelector('td.mkt-cap')) {
                //console.log("MKT CAP уже добавлен для строки.");
                return; // Пропускаем строки, где уже есть MKT CAP
            }
            const priceCell = row.querySelector('td:nth-child(6)'); // Ячейка с Price (4-й столбец)
            const marketCapCell = document.createElement('td');
            marketCapCell.className = 'mkt-cap align-middle';

            if (priceCell) {
                const price = parseFloat(priceCell.textContent.trim().replace('$', '').replace(',', '')); // Получаем значение Price
                const marketCap = isNaN(price) ? 'N/A' : formatNumberToShort(price * 1_000_000_000); // Вычисляем MKT CAP
                marketCapCell.innerText = `${marketCap}`; // Добавляем значение
            } else {
                marketCapCell.innerText = 'N/A'; // Если данных нет
            }

            row.appendChild(marketCapCell); // Добавляем ячейку в строку
        });
    }


    // Запускаем процесс удаления и добавления ссылок периодически
    setInterval(() => {
        try {
            removeRows();
            linkifyInfluencers();
            updateTokenLinks();
            addMarketCapRows();
        } catch (error) {
            console.error('Ошибка в процессе выполнения скрипта:', error);
        }
    }, 1000); // Каждую секунду проверяем таблицу
})();