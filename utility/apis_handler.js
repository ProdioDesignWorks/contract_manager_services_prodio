const request = require('request');
const axios = require('axios');
const querystring = require('querystring');

const {
    isValidObject,
    isValid,
    isObject,
    isNull
} = require('./helper');
const {
    ESIGN_APIS,
    ESIGN_TERMS,
    config
} = require('../config/constants');

function funCallESignAPIs(actionName, requestData, apiMethod) {
    return new Promise((resolve, reject) => {

        const requestBody = {
            grant_type: 'client_credentials',
            client_id: config["clientId"],
            client_secret: config["clientSecret"],
            scope: "read-write"
        }

        const headerBody = {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
        }

        let actionURL = ESIGN_APIS[actionName];

        if(requestData){
            if(!isNull(requestData["templateId"])){
                actionURL = String(actionURL).replace("{{TEMPLATE_ID}}",requestData["templateId"]);
            }
            if(!isNull(requestData["folderId"])){
                actionURL = String(actionURL).replace("{{FOLDER_ID}}",requestData["folderId"]);
            }
        }

        axios.post(ESIGN_APIS["GET_ACCESS_TOKEN"], querystring.stringify(requestBody), headerBody)
          .then((result) => {
            // Do somthing
            //console.log(" \n \n result ",result["data"]);

            if(result["data"]){
                const access_token = result["data"]["access_token"];

                // Call Actual API

                var requestObj = {
                    url: actionURL,
                    headers: {
                        'Authorization': 'Bearer ' + access_token,
                        'content-type': 'application/json',
                    },
                    json: true,
                    method:apiMethod
                };
    
                if(apiMethod=="POST"){
                    requestObj["body"] = requestData;
                }

                console.log("requestObj ==>",requestObj);
    
                request(requestObj, function(err, response) {
                    if (err) {
                        reject({
                            "success": false,
                            "errorMessage": 'Error while requesting data ' + JSON.stringify(err)
                        });
                    }else{
                        if (response.statusCode == 200 || response.statusCode == 201 ) {
                            resolve({
                                "success": true,
                                'body': response.body
                            });
                        }else{
                            reject({
                                "success": false,
                                "errorMessage": "Internal Server Error",
                                "body": response.body
                            });
                        }
                    }
                });

            }else{

            }
            
          })
          .catch((err) => {
            // Do somthing
            reject({
                "success": false,
                "errorMessage": "Internal Server Error",
                "body": err
            });
          })

    });
}


class eSignGenieAPISHandler {
    async funCallApi(actionName, requestData, apiMethod) {
        return await funCallESignAPIs(actionName, requestData,apiMethod);
    }
}

eSignGenieAPISHandler = new eSignGenieAPISHandler();
module.exports = eSignGenieAPISHandler;