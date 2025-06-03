// YCLID UTM Tracker для Google Tag Manager (универсальная версия)
(function() {
    'use strict';
    
    // Функция для установки cookie
    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
        console.log('🍪 ECLID Tracker: Cookie установлен:', name, '=', value);
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
                if (!searchParams.has(key)) {
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
    
    // Функция для обработки ссылок с добавлением параметров
    function processLinks(paramsToAdd) {
        var allLinks = getAllLinks();
        var thmPageRegex = /^https?:\/\/(www\.)?thm\.page/i;
        var processedCount = 0;
        
        console.log('🔍 ECLID Tracker: Обработка ссылок, найдено:', allLinks.length);
        
        for (var i = 0; i < allLinks.length; i++) {
            try {
                var link = allLinks[i];
                if (link.href && thmPageRegex.test(link.href)) {
                    console.log('🎯 ECLID Tracker: Найдена THM.page ссылка:', link.href);
                    
                    // Проверяем, что ссылка еще не обработана
                    if (!link.getAttribute('data-utm-processed')) {
                        var originalHref = link.href;
                        link.href = addParamsToUrl(link.href, paramsToAdd);
                        link.setAttribute('data-utm-processed', 'true');
                        processedCount++;
                        
                        console.log('✅ ECLID Tracker: Ссылка обработана');
                        console.log('   Было:', originalHref);
                        console.log('   Стало:', link.href);
                    } else {
                        console.log('ℹ️ ECLID Tracker: Ссылка уже была обработана');
                    }
                }
            } catch(e) {
                console.error('❌ ECLID Tracker: Ошибка обработки ссылки:', e);
            }
        }
        
        console.log('✅ ECLID Tracker: Обработано ' + processedCount + ' ссылок THM.page');
    }
    
    // Функция для наблюдения за изменениями DOM
    function observeDOM(paramsToAdd) {
        // Обрабатываем существующие ссылки
        processLinks(paramsToAdd);
        
        // Настраиваем MutationObserver для новых ссылок
        if (window.MutationObserver) {
            var observer = new MutationObserver(function(mutations) {
                var shouldProcess = false;
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        for (var i = 0; i < mutation.addedNodes.length; i++) {
                            var node = mutation.addedNodes[i];
                            // Проверяем что это элемент (nodeType === 1)
                            if (node.nodeType === 1) {
                                if (node.tagName === 'A' || (node.querySelector && node.querySelector('a'))) {
                                    shouldProcess = true;
                                    console.log('🔄 ECLID Tracker: Обнаружены новые ссылки в DOM');
                                    break;
                                }
                            }
                        }
                    }
                });
                
                if (shouldProcess) {
                    processLinks(paramsToAdd);
                }
            });
            
            // Ждем, пока body будет доступен
            function startObserver() {
                if (document.body) {
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                    console.log('👁️ ECLID Tracker: MutationObserver запущен');
                } else {
                    setTimeout(startObserver, 100);
                }
            }
            startObserver();
        }
        // Fallback: периодическая проверка для старых браузеров
        else {
            console.log('⚠️ ECLID Tracker: MutationObserver недоступен, используется fallback');
            setInterval(function() {
                processLinks(paramsToAdd);
            }, 2000);
        }
    }

    // Основная функция инициализации
    function initTracker() {
        try {
            console.log('🚀 ECLID Tracker: Инициализация...');
            
            // Сохраняем yclid из URL в cookie
            var yclid = getUrlParam('yclid');
            if (yclid) {
                setCookie('yclid', yclid, 365);
                console.log('✅ ECLID Tracker: YCLID сохранен:', yclid);
            }
            
            // Сохраняем UTM параметры из URL в cookies
            var utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
            utmParams.forEach(function(param) {
                var value = getUrlParam(param);
                if (value) {
                    setCookie(param, value, 365);
                    console.log('✅ ECLID Tracker: UTM параметр сохранен:', param, '=', value);
                }
            });
            
            // Получаем сохраненные параметры
            var paramsToAdd = {};
            var savedYclid = getCookie('yclid');
            if (savedYclid) {
                paramsToAdd.yclid = savedYclid;
                console.log('📖 ECLID Tracker: YCLID из cookies:', savedYclid);
            }
            
            utmParams.forEach(function(param) {
                var value = getCookie(param);
                if (value) {
                    paramsToAdd[param] = value;
                    console.log('📖 ECLID Tracker: UTM из cookies:', param, '=', value);
                }
            });
            
            console.log('🔧 ECLID Tracker: Параметры для добавления:', paramsToAdd);
            
            // Если нет параметров для добавления - выходим
            if (Object.keys(paramsToAdd).length === 0) {
                console.log('⚠️ ECLID Tracker: Нет параметров для добавления');
                return;
            }
            
            // Запускаем наблюдение за ссылками
            observeDOM(paramsToAdd);
            console.log('✅ ECLID Tracker: Наблюдение за ссылками запущено');
            
        } catch (error) {
            console.error('❌ ECLID Tracker: Ошибка инициализации:', error);
        }
    }
    
    // Делаем функцию доступной глобально для тестирования
    window.initTracker = initTracker;
    window.eclid = {
        setCookie: setCookie,
        getCookie: getCookie,
        getUrlParam: getUrlParam,
        processLinks: processLinks,
        addParamsToUrl: addParamsToUrl
    };

    // Запуск при загрузке страницы
    if (document.readyState === 'loading') {
        if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', initTracker);
        } else if (document.attachEvent) {
            document.attachEvent('onreadystatechange', function() {
                if (document.readyState === 'complete') initTracker();
            });
        }
    } else {
        initTracker();
    }
})();
