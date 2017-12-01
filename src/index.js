var APP_ID = process.env.APP_ID;
var LOTTO_DATA_TABLE_NAME = process.env.DB_TABLE;
var credentials = {
    accessKeyId: process.env.DB_ACCESS_KEY_ID,
    secretAccessKey: process.env.DB_SECRET_ACCESS_KEY,
    region: 'eu-west-1'
};


var dynasty = require('dynasty')(credentials);
var lottoDbTable = function() {
    return dynasty.table(LOTTO_DATA_TABLE_NAME);
};

exports.handler = function (request, context) {
    if (request.directive.header.namespace === 'Alexa.Discovery' && request.directive.header.name === 'Discover') {
        log("DEGUG:", "Discover request",  JSON.stringify(request));
        handleDiscovery(request, context, "");
    }
    else if (request.directive.header.namespace === 'Alexa.PowerController') {
        if (request.directive.header.name === 'TurnOn' || request.directive.header.name === 'TurnOff') {
            log("DEBUG:", "TurnOn or TurnOff Request", JSON.stringify(request));
            handlePowerControl(request, context);
        }
    }

    function handleDiscovery(request, context) {
        var payload = {
            "endpoints":
            [
                {
                    "endpointId": "smart_home_dummy_1",
                    "manufacturerName": "Daniel Smart Home Dummy",
                    "friendlyName": "LottoDatenbank",
                    "description": "LottoDatenbank",
                    "displayCategories": ["SWITCH"],
                    "cookie": {
                        "key1": "arbitrary key/value pairs for skill to reference this endpoint.",
                        "key2": "There can be multiple entries",
                        "key3": "but they should only be used for reference purposes.",
                        "key4": "This is not a suitable place to maintain current endpoint state."
                    },
                    "capabilities":
                    [
                        {
                          "type": "AlexaInterface",
                          "interface": "Alexa",
                          "version": "3"
                        },
                        {
                            "interface": "Alexa.PowerController",
                            "version": "3",
                            "type": "AlexaInterface",
                            "properties": {
                                "supported": [{
                                    "name": "powerState"
                                }],
                                 "retrievable": true
                            }
                        }
                    ]
                }
            ]
        };
        var header = request.directive.header;
        header.name = "Discover.Response";
        log("DEBUG", "Discovery Response: ", JSON.stringify({ header: header, payload: payload }));
        context.succeed({ event: { header: header, payload: payload } });
    }

    function log(message, message1, message2) {
        console.log(message + message1 + message2);
    }

    function handlePowerControl(request, context) {
        // get device ID passed in during discovery
        var requestMethod = request.directive.header.name;
        // get user token pass in request
        var requestToken = request.directive.payload.scope.token;
        var powerResult;

        if (requestMethod === "TurnOn") {

            // Make the call to your device cloud for control 
            // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
            powerResult = "OFF"; // -> use OFF here so Alexa thinks device is still offline and when calling "ON" next time, it will definitely route the call!!! //powerResult = "ON";
            
        }
       else if (requestMethod === "TurnOff") {
            // Make the call to your device cloud for control and check for success 
            // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
            powerResult = "ON"; // -> use OFF here so Alexa thinks device is still offline and when calling "ON" next time, it will definitely route the call!!! //powerResult = "OFF";
        }

        lottoDbTable().scan().then(function(allEntries) {
            var output = "Aktuell hast du " + allEntries.length + " Einträge in deiner Datenbank.";

            var response = {
                "event": {
                    "header": {
                      "namespace": "Alexa",
                      "name": "ErrorResponse",
                      "messageId": request.directive.header.messageId ,
                      "correlationToken": requestToken,
                      "payloadVersion": "3"
                    },
                    "endpoint":{
                        "endpointId":"smart_home_dummy_1"
                    },
                    "payload": {
                      "type": "ENDPOINT_UNREACHABLE",
                      "message": output
                    }
                  }
                };
            log("DEBUG", "Alexa.PowerController ", JSON.stringify(response));
            context.succeed(response);
        });
    }
};
