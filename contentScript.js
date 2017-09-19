window.browser = (function () {
    return window.msBrowser ||
        window.browser ||
        window.chrome ||
        browser;
})();

function sendMessage(message, cb) {
    window.browser.runtime.sendMessage(message, function (response) {
        if (cb) {
            cb(response);
        }
    });
};

function listenForMessage(callback) {
    window.browser.runtime.onMessage.addListener(callback);
};

listenForMessage(function(request, sender, sendResponse) {
    var action = request.action;
    // Only answer to actions.
    if (!action) {
        return;
    }

    if (action === "reload") {
        window.location.reload();
    }
});

var theMightyReplaceFunction = function(nodes, codenames, replacedCodenames) {
    for (var index = 0; index < nodes.length; index++) {
        var node = nodes[index];

        if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE") {
            continue;
        }
        
        if (node.nodeName === "#text" && node.textContent) {
            var newContent = node.textContent;
            var changeFound = false;

            for (var codenameIndex = 0; codenameIndex < codenames.length; codenameIndex++) {
                var codename = codenames[codenameIndex];
                var regex = new RegExp(codename, "g");

                if (!regex.test(newContent)) {
                    continue;
                }

                changeFound = true;
                if (replacedCodenames) {
                    newContent = newContent.replace(regex, replacedCodenames[codenameIndex]);
                } else {
                    newContent = newContent.replace(regex, "<span style='background: black; color: black'>" + codename + "</span>");
                }
            }

            if (changeFound) {
                var parent = node.parentElement;
    
                // New element
                var span = document.createElement("span");
                span.innerHTML = newContent;
    
                // Let's replace it
                parent.replaceChild(span, node);
            }
        }

        theMightyReplaceFunction(node.childNodes, codenames, replacedCodenames);
    }
}

var theMightyReplaceFunctionForImages = function(nodes, sourceHint, replaceUrl) {
    for (var index = 0; index < nodes.length; index++) {
        var node = nodes[index];

        if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE") {
            continue;
        }

        if (node.nodeName === "IMG" && (            
            node.src && node.src.toLowerCase().indexOf(sourceHint) !== -1 || 
            node.alt && node.alt.toLowerCase().indexOf(sourceHint) !== -1 
        )) {
            node.src = replaceUrl;
        }

        theMightyReplaceFunctionForImages(node.childNodes, sourceHint, replaceUrl);
    }
}

var redact = function(nodes, replace) {
    var codenames = [
        "Google",
        "Android",
        "Apple",
        "IPhone",
        "MacOS",
        "iOS", 
        "Chrome",
        "Firefox",
        "iPad",
        "three.js"
    ];

    var replacedCodenames = [
        "Microsoft",
        "Windows",
        "Microsoft",
        "Windows",
        "Windows",
        "Windows",
        "Edge", 
        "Edge",
        "Surface",
        "babylon.js"
    ];    

    theMightyReplaceFunction(nodes, codenames, replace ? replacedCodenames : null);
}

var runMILF = function(nodes) {
    var codenames = [
        "Mitsuru Furuta",
        "Mitsu Furuta",
        "Mitsuru",
        "Mitsu"
    ];

    var replacedCodenames = [
        "David Catuhe",
        "David Catuhe",
        "David",
        "David"
    ];    

    // Text
    theMightyReplaceFunction(nodes, codenames, replacedCodenames);
        
    // Images
    theMightyReplaceFunctionForImages(nodes, "mitsu", "https://cdn-images-1.medium.com/max/800/1*8Dq2jbf14fb8tL3RvH3lVw.png");

    setTimeout(() => {
        runMILF(nodes);
    }, 1000);
}

document.addEventListener("DOMContentLoaded", function () {

    window.browser.storage.sync.get(['mode'], function(item) {
        var modeIndex = item ? item.mode : 0;

        switch (modeIndex) {
            case 0:
                redact(document.childNodes);
                break;
            case 1:
                redact(document.childNodes, true);
                break;
            case 2:
                runMILF(document.childNodes);
                break;
        }
    });

    sendMessage({ ui: true }, function (response) {
    });  
});