// YCLID UTM Tracker для Google Tag Manager (универсальная версия)
(function() {
    // Функция для установки cookie
    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
    }

    // Функция для получения cookie
    function getCookie(name) {
        var matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\\\/\+\^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    // Функция для получения параметра из URL
    function getUrlParam(param) {
        var search = window.location.search;
        if (!search) return null;
        
        var params = search.substring(1).split('&');
        for (var i = 0; i < params.length; i++) {
            var pair = params[i].split('=');
            if (pair[0] === param) {
                return pair[1] ? decodeURIComponent(pair[1]) : '';
            }
        }
        return null;
    }

    // Функция для получения всех ссылок
    function getAllLinks() {
        return document.querySelectorAll ? document.querySelectorAll('a[href]') : 
               document.getElementsByTagName('a');
    }

    // Функция добавления параметров к URL с сохранением существующих
    function addParamsToUrl(url, params) {
        if (!url || !params) return url;
        
        try {
            var urlObj = new URL(url);
            var searchParams = urlObj.searchParams || new URLSearchParams(urlObj.search);
            
            // Добавляем параметры, если их еще нет в URL
            Object.keys(params).forEach(function(key) {
                if (!searchParams.has(key) {
                    searchParams.set(key, params[key]);
                }
            });
            
            // Собираем URL обратно
            urlObj.search = searchParams.toString();
            return urlObj.toString();
            
        } catch(e) {
            // Fallback для старых браузеров или невалидных URL
            var separator = url.indexOf('?') === -1 ? '?' : '&';
            var paramsStr = Object.keys(params).map(function(key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            }).join('&');
            
            return url + separator + paramsStr;
        }
    }

    // Основная функция инициализации
    function initTracker() {
        try {
            // Сохраняем yclid из URL в cookie
            var yclid = getUrlParam('yclid');
            if (yclid) {
                setCookie('yclid', yclid, 365);
            }
            
            // Сохраняем UTM параметры из URL в cookies
            var utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
            utmParams.forEach(function(param) {
                var value = getUrlParam(param);
                if (value) {
                    setCookie(param, value, 365);
                }
            });
            
            // Получаем сохраненные параметры
            var paramsToAdd = {};
            var savedYclid = getCookie('yclid');
            if (savedYclid) {
                paramsToAdd.utm_term = savedYclid;
            }
            
            utmParams.slice(0, 4).forEach(function(param) { // исключаем utm_term (уже обработан)
                var value = getCookie(param);
                if (value) {
                    paramsToAdd[param] = value;
                }
            });
            
            // Если нет параметров для добавления - выходим
            if (Object.keys(paramsToAdd).length === 0) return;
            
            // Обрабатываем ссылки на странице
            var allLinks = getAllLinks();
            var thmPageRegex = /^https?:\/\/(www\.)?thm\.page/i;
            
            for (var i = 0; i < allLinks.length; i++) {
                try {
                    var link = allLinks[i];
                    if (link.href && thmPageRegex.test(link.href)) {
                        link.href = addParamsToUrl(link.href, paramsToAdd);
                    }
                } catch(e) {
                    // Игнорируем ошибки обработки отдельных ссылок
                }
            }
        } catch (error) {
            // Игнорируем общие ошибки
        }
    }

    // Запуск при загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener ? document.addEventListener('DOMContentLoaded', initTracker) :
        document.attachEvent('onreadystatechange', function() {
            if (document.readyState === 'complete') initTracker();
        });
    } else {
        initTracker();
    }
})();
