window.browser = (function () {
    return window.msBrowser ||
      window.browser ||
      window.chrome ||
      browser;
  })();

function sendMessage(message) {
    try {
        window.browser.tabs.query({ active: true, currentWindow: true }, function(tabs) { 
            window.browser.tabs.sendMessage(tabs[0].id, message, function(response) { }); 
        });
    }
    catch (e) {
        // Tab has probably been closed.
    }
};

var modes;
function onModeSelected() {
    var modeIndex = modes.selectedIndex;

    window.browser.storage.sync.set({'mode': modeIndex});

    sendMessage({action: "reload"});
}

document.addEventListener("DOMContentLoaded", function () {
    modes = document.getElementById("modes");
    
    window.browser.storage.sync.get(['mode'], function(item) {
        if (!item) {
            return;
        }
        var modeIndex = item.mode;
    
        if (modeIndex) {
            modes.selectedIndex = modeIndex;
        }
    });

    modes.addEventListener("change", onModeSelected);
});