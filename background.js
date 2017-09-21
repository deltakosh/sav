window.browser = (function () {
    return  window.msBrowser ||
            window.browser ||
            window.chrome;
})();

function sendMessage(message) {
    window.browser.tabs.query({ active: true, currentWindow: true }, function(tabs) { 
        window.browser.tabs.sendMessage(tabs[0].id, message, function(response) { }); 
    });
};

function listenForMessage(callback) {
    window.browser.runtime.onMessage.addListener(callback);
};

listenForMessage(function(request, sender, sendResponse) {
    if (request.ui) {
        window.browser.pageAction.show(sender.tab.id);
    }
});

// https://investir.lesechos.fr/actions/actualites/exclusif-ue-google-propose-un-systeme-d-encheres-aux-comparateurs-concurrents-1706157.php#

// https://www.lesechos.fr/tech-medias/hightech/030589488781-amazon-pourrait-lancer-des-lunettes-connectees-equipees-dalexa-2115739.php

// http://www.getyellow.io/en/about-us/

// https://developer.microsoft.com/en-us/dashboard/analytics/reports/reviews?productId=9NBLGGH1ZJ3R