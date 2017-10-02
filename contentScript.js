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

var registerNode = function(node, nodeInfos, codenames, replacedCodenames) {
    nodeInfos.push({
        text: node.textContent,
        callback: function() {
            processNode(node, codenames, replacedCodenames);
        },
        index: nodeInfos.length
    });
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
                registerNode(node, nodeInfos, codenames, replacedCodenames);
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

        if ((score / response.documents.length) > 0.55) {
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
        "d’Alexa",
        "d'Alexa",
        "Alexa",
        "Alphabet"
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
        "de Cortana",
        "Cortana",
        "Catuhe Corp"
    ];    

    if (analyzeSentiment) {
        var nodeInfos = [];
        theMightyPrepareFunction(nodes, nodeInfos, codenames, replacedCodenames);   
        theMightyReplaceFunction(nodeInfos); 
    } else {
        theStupidReplaceFunction(nodes, codenames, replace ? replacedCodenames : null);
    }
}

var timeout;
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

    timeout = setTimeout(() => {
        runMILF(nodes);
    }, 1000);
}

var currentRating = 0;
var goodReviews = [];
var currentAuthorNode;
var fixDevCenter = function(nodes, improve) {

    var suffixes = [
        " le teubé",
        " la grosse quiche",
        " le gros faisan",
        " le blaireau",
        " la mite en pullover"
    ];

    for (var index = 0; index < nodes.length; index++) {
        var node = nodes[index];

        if (node.nodeName === "SCRIPT" || node.nodeName === "STYLE") {
            continue;
        }
        if (node.nodeName === "DIV" && node.className) {
            if (node.className.indexOf("ratingStars") !== -1) {
                currentRating = 0;
                // Let's count stars
                for (var childIndex = 0; childIndex < node.childNodes.length; childIndex++) {
                    var child = node.childNodes[childIndex];

                    if (child.nodeName === "SPAN" && child.attributes["ng-repeat"] && child.attributes["ng-repeat"].value.indexOf("constructor(review.Rating)") !== -1) {
                        currentRating++;
                    }
                }
            } else if (node.className.indexOf("review-text") !== -1 && !node._updated) {

                if (improve) {
                    if (currentRating === 5) {
                        goodReviews.push(node.innerHTML);
                    } else {
                        if (!goodReviews.length) {
                            node.innerHTML = "C'est vraiment la meilleure app du monde."
                        } else {
                            node.innerHTML = goodReviews[((Math.random() * (goodReviews.length)) | 0)];
                        }
                    }
                    node._updated = true;
                } else {
                    if (currentRating < 4 && currentAuthorNode) {
                        currentAuthorNode.innerHTML += suffixes[((Math.random() * (suffixes.length)) | 0)];
                        currentAuthorNode = null;
                    }
                }

            } 
        }

        // Fix stars
        if (node.nodeName === "SPAN" && node.className) {
            if (improve) {
                node.className = node.className.replace("win-icon-StarEmpty", "win-icon-StarFull");
            } else {
                if (!node._updated && node.attributes["ng-if"]) {
                    node._updated = true;
                    if (node.attributes["ng-if"].value.indexOf("!review.Title && review.UserName") !== -1) {
                        if (currentRating !== 5) {
                            node.innerHTML += suffixes[((Math.random() * (suffixes.length)) | 0)];
                            currentAuthorNode = null;
                        }
                    } else if (node.attributes["ng-if"].value.indexOf("review.Title && review.UserName") !== -1) {
                        currentAuthorNode = node;                        
                    }
                } 
            }
        }

        fixDevCenter(node.childNodes, improve);
    }
}

var repeatlyfixDevCenter = function(nodes, improve) {
    fixDevCenter(nodes, improve);

    timeout = setTimeout(() => {
        repeatlyfixDevCenter(nodes, improve);
    }, 1000);
}

var injectPonyIntenseProtectionEnhancer = function(node) {
    var parent = node.parentElement;

    parent.removeChild(node);
    var node = document.createElement("div");
    parent.appendChild(node);

    var img = document.createElement("img");
    node.appendChild(img);

    img.style.width = "100%";
    img.style.height = "100%";
    
    var ponyID = Math.random();

    if (ponyID < 0.25) {
        ponyID = "G009SWR5LZC9";
        img.src = "data:image/jpeg;base64,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";
    } else if (ponyID < 0.5) {
        ponyID = "G009SXDVD98M";
        img.src = "data:image/jpeg;base64,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";
    } else if (ponyID < 0.75) {
        ponyID = "G009SXL611MK";
        img.src = "data:image/jpeg;base64,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";
    } else {
        ponyID = "G009SXT11NLM";
        img.src = "data:image/jpeg;base64,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";
    }

    img.addEventListener("mousedown", function(evt) {

        if (evt.button == 2) {
            evt.preventDefault();
            window.location.href = "https://playground.babylonjs.com/frame.html?noui&remixID=" + ponyID + "#3YSIDV#93";
            return;
        }

        var iframe = document.createElement("iframe");
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
        node.appendChild(iframe);
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.frameBorder=0;
        iframe.src = "https://playground.babylonjs.com/frame.html?noui&remixID=" + ponyID + "#3YSIDV#93";
    });
}

var injectExtremeDefenseGridEngine2 = function(nodes) {
    for (var index = 0; index < nodes.length; index++) {
        var node = nodes[index];

        // search for images...ALL images :)
        if (node.className === "video-box-image") {  
            injectPonyIntenseProtectionEnhancer(node);
        } else if (node.id === "network-bar") { // Network
            node.parentElement.removeChild(node);     
        } else if (node.id === "js_logo_img") { // Logo
            node.src = "data:image/png;base64,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";
        } else if (node.className && node.className.indexOf("eight") !== -1) {  // Ads
            node.parentElement.removeChild(node);
        } else if (node.className && node.className.indexOf("hot-videos-women-wrapper") !== -1) {  // Ads
            node.parentElement.removeChild(node);            
        } else if (node.className && node.className.indexOf("collection-box") !== -1) {  // Collections
            node.parentElement.removeChild(node);            
        } else if (node.className && node.className.indexOf("porn-star-list") !== -1) {  // Pornstars
            node.parentElement.removeChild(node);            
        } else if (node.nodeName === "#text" && node.textContent && node.textContent.trim()) {
            var content = node.textContent;
            slangs.forEach((slang) => {
                var regex = new RegExp(slang, "gim");
                if (regex.test(content)) {
                    content = content.replace(regex, "pony");
                }
            });
            node.textContent = content;
        }
            
        injectExtremeDefenseGridEngine2(node.childNodes);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    var d = new Date();
    var n = d.getFullYear();

    if (window.location.host.indexOf("porn") !== -1 && n < 2050) {
        injectExtremeDefenseGridEngine2(document.childNodes);
       // keepVideosOut(document.childNodes);
        return;
    }

    window.browser.storage.sync.get(['mode'], function(item) {
        var modeIndex = item ? item.mode : 0;

        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

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
            case 4:
                repeatlyfixDevCenter(document.childNodes, true);
                break;                
            case 5:
                repeatlyfixDevCenter(document.childNodes, false);
                break;          
        }
    });

    sendMessage({ ui: true }, function (response) {
    });  
});


var slangs = [
"anal",
"anus",
"arse",
"ass",
"ballsack",
"balls",
"bastard",
"bastard",
"bitch",
"biatch",
"bloody",
"blowjob",
"blow job",
"bollock",
"bollok",
"boner",
"boob",
"bugger",
"bum",
"butt",
"buttplug",
"busty",
"clitoris",
"cock",
"coon",
"crap",
"cunt",
"cum",
"cumshot",
"damn",
"dick",
"dildo",
"dyke",
"fag",
"feck",
"fellate",
"fellation",
"felching",
"fuck",
"fucking",
"fucks",
"fucked",
"f u c k",
"fudgepacker",
"fudge packer",
"flange",
"gay",
"Goddamn",
"God damn",
"hardcore",
"softcore",
"hell",
"hot",
"homo",
"horny",
"jerk",
"jizz",
"knobend",
"knob end",
"labia",
"lesbian",
"lesbians",
"lmao",
"lmfao",
"muff",
"nigger",
"nigga",
"omg",
"orgy",
"orgasm",
"penis",
"piss",
"poop",
"porn",
"pornstar",
"pornstars",
"prick",
"pube",
"pussy",
"queer",
"scrotum",
"sex",
"sexy",
"shit",
"slut",
"slutty",
"smegma",
"spunk",
"tit",
"titted",
"tits",
"tosser",
"turd",
"twat",
"vagina",
"wank",
"whore",
"wtf",
"dildo",
"dildos",
"vibrator",
"vibrators",
"cunts",
"masturbate",
"masturbation",
"fist",
"fisting",
"masturbating",
"sexe",
"tube",
"fetish",
"squirt",
"cunnilingus",
"shemale",
"finger",
"amateur",
"bbw",
"handjob",
"MILF",
"Mature",
"swallow",
"shaved",
"threesome"];