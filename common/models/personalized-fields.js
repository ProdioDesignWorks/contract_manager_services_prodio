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

module.exports = function(Personalizedfields) {

    Personalizedfields.remoteMethod(
        'addPersonalizedFields', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'payload', type: 'object', required: false, http: { source: 'body' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Personalizedfields.addPersonalizedFields = function(payload, cb) {
        if (!isNull(payload["meta"])) {
            payload = payload["meta"];
        }

        if(isNull(payload["businessId"])){
            return cb(new HttpErrors.BadRequest('Please Provide Business ID', { expose: false }));
        }

        if(isNull(payload["fields"])){
            return cb(new HttpErrors.BadRequest('Please Provide Custom Fields', { expose: false }));
        }

        Personalizedfields.findOne({"where":{"businessId": convertObjectIdToString(payload["businessId"])}}).then(response=>{
            if(isValidObject(response)){
                let alreadyAvailableFields = response["fields"];
                const finalFields = alreadyAvailableFields.concat(payload["fields"]).unique();
                response.updateAttributes({"fields": finalFields,"updatedAt": new Date() }).then(res=>{
                    cb(null,res);
                })
            }else{
                let saveFields = {
                    "businessId": convertObjectIdToString(payload["businessId"]),
                    "fields":payload["fields"],
                    "isActive": true,
                    "createdAt": new Date()
                }
                Personalizedfields.create(saveFields).then(res=>{
                    cb(null,res);
                }).catch(err=>{
                    cb(new HttpErrors.InternalServerError((err), { expose: false }));
                })
            }
        }).catch(err=>{
            cb(new HttpErrors.InternalServerError((err), { expose: false }));
        })
    }


    Personalizedfields.remoteMethod(
        'removePersonalizedFields', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'payload', type: 'object', required: false, http: { source: 'body' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Personalizedfields.removePersonalizedFields = function(payload, cb) {

        if (!isNull(payload["meta"])) {
            payload = payload["meta"];
        }

        if(isNull(payload["businessId"])){
            return cb(new HttpErrors.BadRequest('Please Provide Business ID', { expose: false }));
        }

        if(isNull(payload["fields"])){
            return cb(new HttpErrors.BadRequest('Please Provide Custom Fields', { expose: false }));
        }

        Personalizedfields.findOne({"where":{"businessId": convertObjectIdToString(payload["businessId"])}}).then(response=>{
            if(isValidObject(response)){
                let alreadyAvailableFields = response["fields"];
                const filteredItems = alreadyAvailableFields.filter(item => !payload["fields"].includes(item));

                response.updateAttributes({"fields": filteredItems,"updatedAt": new Date() }).then(res=>{
                    cb(null,res);
                })
            }else{
                cb(new HttpErrors.InternalServerError(("Invalid BusinessId or no records found."), { expose: false }));
            }
        }).catch(err=>{
            cb(new HttpErrors.InternalServerError((err), { expose: false }));
        })
        
        
    }


    
};
