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

var processNode = function(node, codenames, replacedCodenames) {    
    var changeFound = false;
    var newContent = node.textContent;
    
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

var theStupidReplaceFunction = function(nodes, codenames, replacedCodenames) {
    for (var index = 0; index < nodes.length; index++) {
        var node = nodes[index];

        if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE") {
            continue;
        }
        
        if (node.nodeName === "#text" && node.textContent && node.textContent.trim()) {
            processNode(node, codenames, replacedCodenames);
        }

        theStupidReplaceFunction(node.childNodes, codenames, replacedCodenames);
    }
}

var theMightyPrepareFunction = function(nodes, nodeInfos, codenames, replacedCodenames) {
    for (var index = 0; index < nodes.length; index++) {
        var node = nodes[index];

        if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE") {
            continue;
        }
        
        if (node.nodeName === "#text" && node.textContent && node.textContent.trim()) {

            var codenameFound = false;
            for (var codenameIndex = 0; codenameIndex < codenames.length; codenameIndex++) {
                var codename = codenames[codenameIndex];
                var regex = new RegExp(codename, "g");
        
                if (regex.test(node.textContent)) {
                    codenameFound = true;
                    break;
                }
            }

            if (codenameFound) {
                nodeInfos.push({
                    text: node.textContent,
                    callback: function() {
                        processNode(node, codenames, replacedCodenames);
                    },
                    index: nodeInfos.length
                });
            }
        }

        theMightyPrepareFunction(node.childNodes, nodeInfos, codenames, replacedCodenames);
    }
}

var theMightyReplaceFunction = function(nodeInfos) {
    if (!nodeInfos.length) {
        return;
    }

    var oReq = new XMLHttpRequest();
    
    oReq.onload = function(e) {
        var response = JSON.parse(oReq.responseText);

        // Let's find an average sentiment score
        var score = 0;
        for (var index = 0; index < response.documents.length; index++) {
            score += response.documents[index].score;
        }

        if ((score / response.documents.length) > 0.45) {
            // It is a positive article, let's the magic happen
            for (var index = 0; index < response.documents.length; index++) {
                var id = response.documents[index].id;
                nodeInfos[id].callback();
            }
        }
    }

    var query = {
        "documents": [          
        ]
      };

    for (var index = 0; index < nodeInfos.length; index++) {
        var node = nodeInfos[index];
        query.documents.push({
            "language": "fr",
            "id": node.index,
            "text": node.text
          });
    }

    oReq.open("POST", "https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment");
    oReq.setRequestHeader("Content-Type","application/json");
    oReq.setRequestHeader("Ocp-Apim-Subscription-Key","e6f697c3584e4d6baa830ca98ba0990e");
    oReq.send(JSON.stringify(query));
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

var redact = function(nodes, replace, analyzeSentiment) {
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
        "three.js",
        "Amazon",
        "d'Alexa",
        "Alexa"
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
        "babylon.js",
        "Microsoft",
        "de Cortana",
        "Cortana"
    ];    

    if (analyzeSentiment) {
        var nodeInfos = [];
        theMightyPrepareFunction(nodes, nodeInfos, codenames, replacedCodenames);   
        theMightyReplaceFunction(nodeInfos); 
    } else {
        theStupidReplaceFunction(nodes, codenames, replace ? replacedCodenames : null);
    }
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
    theStupidReplaceFunction(nodes, codenames, replacedCodenames);
        
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
                redact(document.childNodes, true, true);
                break;
            case 3:
                runMILF(document.childNodes);
                break;
        }
    });

    sendMessage({ ui: true }, function (response) {
    });  
});