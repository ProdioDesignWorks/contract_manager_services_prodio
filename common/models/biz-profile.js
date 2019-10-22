'use strict';
const {
	HttpErrors,
	request,
	findReplace,
    unique,
    isValidObject,
    isValid,
    flattenArray,
    clean,
    isArray,
    isObject,
    print,
    isNull,
    ESIGN_APIS,
    ESIGN_TERMS,
    config,
    eSignGenieAPISHandler,
    convertObjectIdToString
} = require('../../utility/common');

module.exports = function(Bizprofile) {

    Bizprofile.remoteMethod(
        'saveWebhookUrlForBiz', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'webHookData', type: 'object', required: false, http: { source: 'body' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Bizprofile.saveWebhookUrlForBiz = function(webHookData, cb) {
        if (!isNull(webHookData["meta"])) {
            webHookData = webHookData["meta"];
        }
        
        if(isNull(webHookData["businessId"])){
            return cb(new HttpErrors.BadRequest('Please Provide Business ID', { expose: false }));
        }

        if(isNull(webHookData["webhookUrl"])){
            return cb(new HttpErrors.BadRequest('Please Provide Business Webhook Url', { expose: false }));
        }

        Bizprofile.findOne({"where":{ "businessId": convertObjectIdToString(webHookData["businessId"]) }}).then(bizInfo=>{
            if(isValidObject(bizInfo)){
                bizInfo.updateAttributes({"webhookUrl": webHookData["webhookUrl"] }).then(updateInfo=>{
                    cb(null,updateInfo);
                })
            }else{
                let createJson = {
                    "businessId": convertObjectIdToString(webHookData["businessId"]),
                    "webhookUrl": webHookData["webhookUrl"],
                    "createdAt": new Date(),
                    "isActive": true
                }

                Bizprofile.create(createJson).then(res=>{
                    cb(null,res);
                }).catch(err=>{
                    cb(new HttpErrors.InternalServerError((err), { expose: false }));
                })
            }
        })
    }

};
