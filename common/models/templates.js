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

module.exports = function(Templates) {

    Templates.remoteMethod(
        'createTemplate', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'templateData', type: 'object', required: false, http: { source: 'body' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Templates.createTemplate = function(templateData, cb) {
        if (!isNull(templateData["meta"])) {
            templateData = templateData["meta"];
        }
        
        if(isNull(templateData["templateUrl"])){
            return cb(new HttpErrors.BadRequest('Please Provide Template URL', { expose: false }));
        }
        if(isNull(templateData["templateName"])){
            return cb(new HttpErrors.BadRequest('Please Provide Template Name', { expose: false }));
        }
        if(isNull(templateData["businessId"])){
            return cb(new HttpErrors.BadRequest('Please Provide Template Name', { expose: false }));
        }

        var parts = String(templateData["templateUrl"]).split('/');
        var pdfName = parts[parts.length - 1];

        let themeColor = "#f4e542";
        if(!isNull(templateData["themeColor"])){
            themeColor = templateData["themeColor"];
        }
        let templateDesc = "";
        if(!isNull(templateData["templateDescription"])){
            templateDesc = templateData["templateDescription"];
        }

        let saveTemplate = {
            "templateUrl":"https://cexchange.s3.ap-south-1.amazonaws.com/courses/lessions/documents/pdf1568202927632_sample.pdf",
            "templateName": pdfName,
            "processTextTags":true,
            "templateDesc": templateDesc,
            "numberOfParties":1,
            "themeColor": themeColor,
            "createEmbeddedTemplateSession":true,
            "shareAll":false,
            "redirectURL":"YOUR_PAGE_TO_REDIRECT_USER_FROM_EMBEDDED_SESSION",
            "hideMoreAction": true,
            "hideShareWithAll": true,
            "hideAddParty": true,
        }

        eSignGenieAPISHandler.funCallApi(ESIGN_TERMS["CREATE_TEMPLATE"],saveTemplate,"POST").then(templateResponse=>{
            //cb(null,templateResponse);
            if(templateResponse["success"]){
                if(templateResponse["body"]["result"] === "success"){

                    let templateModel = templateResponse["body"];
                    templateModel["businessId"] = convertObjectIdToString(templateData["businessId"]);
                    templateModel["isActive"] = true;
                    templateModel["createdAt"] = new Date();
                    templateModel["templateName"] = templateData["templateName"];
                    templateModel["templateDescription"] = templateData["templateDescription"];
                    
                    Templates.create(templateModel).then(response=>{
                        cb(null,{"templateId": response["templateId"],"templateName": response["templateName"],"createdAt": response["createdAt"] ,"embeddedTemplateSessionURL": response["embeddedTemplateSessionURL"] });
                    }).catch(err=>{
                        cb(new HttpErrors.InternalServerError((err), { expose: false }));
                    });

                }else{
                    cb(new HttpErrors.InternalServerError((templateResponse["body"]["error_description"]), { expose: false }));
                }
            }else{
                cb(new HttpErrors.InternalServerError((templateResponse["body"]), {
                    expose: false
                }));
            }
        }).catch(err=>{
            cb(new HttpErrors.InternalServerError((err), { expose: false }));
        })
    }


    Templates.remoteMethod(
        'editTemplate', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'templateData', type: 'object', required: false, http: { source: 'body' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Templates.editTemplate = function(templateData, cb) {
        if (!isNull(templateData["meta"])) {
            templateData = templateData["meta"];
        }
        
        if(isNull(templateData["templateId"])){
            return cb(new HttpErrors.BadRequest('Please Provide Template ID', { expose: false }));
        }
        let updateJson = null;

        if(!isNull(templateData["templateName"])){
            updateJson["templateName"] = templateData["templateName"];
        }
        if(!isNull(templateData["templateDescription"])){
            updateJson["templateDescription"] = templateData["templateDescription"];
        }

        Templates.findById(templateData["templateId"]).then(response=>{
            if(isValidObject(response)){
                if(!isNull(updateJson)){
                    response.updateAttributes(updateJson).then(res=>{
                        
                    })
                }
                cb(null,{"templateId": response["templateId"],"embeddedTemplateSessionURL": response["embeddedTemplateSessionURL"] });
            }else{
                cb(new HttpErrors.InternalServerError("Invalid Template ID.", { expose: false }));
            }
        }).catch(err=>{
            cb(new HttpErrors.InternalServerError((err), { expose: false }));
        })
    }


    Templates.remoteMethod(
        'getTemplateDetails', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'templateData', type: 'object', required: false, http: { source: 'body' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Templates.getTemplateDetails = function(templateData, cb) {
        if (!isNull(templateData["meta"])) {
            templateData = templateData["meta"];
        }
        
        if(isNull(templateData["templateId"])){
            return cb(new HttpErrors.BadRequest('Please Provide Template ID', { expose: false }));
        }

        Templates.findById(templateData["templateId"]).then(response=>{
            if(isValidObject(response)){
                cb(null,response);
            }else{
                cb(new HttpErrors.InternalServerError("Invalid Template ID.", { expose: false }));
            }
        }).catch(err=>{
            cb(new HttpErrors.InternalServerError((err), { expose: false }));
        })
    }

    Templates.remoteMethod(
        'deleteTemplate', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'templateData', type: 'object', required: false, http: { source: 'body' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Templates.deleteTemplate = function(templateData, cb) {
        if (!isNull(templateData["meta"])) {
            templateData = templateData["meta"];
        }
        
        if(isNull(templateData["templateId"])){
            return cb(new HttpErrors.BadRequest('Please Provide Template ID', { expose: false }));
        }

        Templates.findById(templateData["templateId"]).then(response=>{
            if(isValidObject(response)){
                response.updateAttributes({"isActive":false}).then(res=>{
                    cb(null,res);
                })
            }else{
                cb(new HttpErrors.InternalServerError("Invalid Template ID.", { expose: false }));
            }
        }).catch(err=>{
            cb(new HttpErrors.InternalServerError((err), { expose: false }));
        })
    }

    Templates.remoteMethod(
        'listAllTemplates', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'templateData', type: 'object', required: false, http: { source: 'body' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Templates.listAllTemplates = function(templateData, cb) {
        if (!isNull(templateData["meta"])) {
            templateData = templateData["meta"];
        }
        
        if(isNull(templateData["businessId"])){
            return cb(new HttpErrors.BadRequest('Please Provide Business ID', { expose: false }));
        }

        Templates.find({"where":{"businessId": convertObjectIdToString(templateData["businessId"]) },"fields":["templateId","embeddedTemplateSessionURL","templateName","templateDescription","isActive","createdAt"]}).then(templatesRecords=>{
            cb(null,templatesRecords)
        }).catch(err=>{
            cb(new HttpErrors.InternalServerError((err), { expose: false }));
        })
    }




};
