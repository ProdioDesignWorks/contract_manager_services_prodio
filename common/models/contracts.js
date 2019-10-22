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

const asyncFunc = require('async');
const axios = require('axios');

module.exports = function(Contracts) {

    Contracts.remoteMethod(
        'createContract', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'contractData', type: 'object', required: true, http: { source: 'body' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Contracts.createContract = function(contractData, cb) {
        if (!isNull(contractData["meta"])) {
            contractData = contractData["meta"];
        }
        
        if(isNull(contractData["contractName"])){
            return cb(new HttpErrors.BadRequest('Please Provide Contract Name', { expose: false }));
        }

        if(isNull(contractData["templateIds"])){
            return cb(new HttpErrors.BadRequest('Please Provide Template IDs', { expose: false }));
        }

        if(isNull(contractData["customFields"])){
            return cb(new HttpErrors.BadRequest('Please Provide Custom Fields', { expose: false }));
        }

        if(isNull(contractData["businessId"])){
            return cb(new HttpErrors.BadRequest('Please Provide Business Id', { expose: false }));
        }
        let bizPayload = {};
        if(!isNull(contractData["metaData"])){
            bizPayload = contractData["metaData"];
        }

        contractData["bizPayload"] = bizPayload;

        if(isNull(contractData["receivers"])){
            return cb(new HttpErrors.BadRequest('Please Provide Receiver Info', { expose: false }));
        }else{

            let _receivers = []; let lcount = 1;
            asyncFunc.each(contractData["receivers"],function(item,clb){
                item["permission"] = "SIGN_ONLY";
                item["sequence"] = lcount;
                item["hostEmailId"] = "EMAIL_ID_OF_INPERSON_ADMINISTRATOR";
                item["allowNameChange"] = true;
                _receivers.push(item); 
                lcount++;
                 clb();
            },function(){
                contractData["receivers"] = _receivers;
            })
        }

        let templateIds = [];

        Contracts.app.models.Templates.find({"where":{"templateId":{"inq":contractData["templateIds"]}},"fields":["template"]}).then(templatesList=>{
            if(isArray(templatesList)){
                templatesList = JSON.parse(JSON.stringify(templatesList));

                asyncFunc.each(templatesList,function(item,clb){
                    if(!isNull(item["template"])){
                        templateIds.push(item["template"]["templateId"]);
                    }
                    
                    clb();
                },function(){
                    createContract(contractData,templateIds).then(res=>{
                        cb(null,res);
                    }).catch(err=>{
                        cb(new HttpErrors.InternalServerError((err), { expose: false }));
                    })
                });

            }else{
                return cb(new HttpErrors.BadRequest('Please Provide Valid Template IDs', { expose: false }));
            }
        }).catch(err=>{
            cb(new HttpErrors.InternalServerError((err), { expose: false }));
        })

    }

    async function createContract(contractData,templateIds){
        return new Promise((resolve,reject)=>{
            let saveContract = {
                "contractName": contractData["contractName"],
                "originalTemplateIds": contractData["templateIds"],
                "businessId": contractData["businessId"],
                "templateIds": templateIds,
                "receivers": contractData["receivers"],
                "fields": contractData["customFields"],
                "bizPayload": contractData["bizPayload"],
                "isActive": true,
                "createdAt": new Date()
            };

            Contracts.create(saveContract).then(res=>{
                sendContract(contractData,res,false).then(response=>{
                    resolve(res);
                }).catch(err=>{
                    reject(err);
                })
            }).catch(err=>{
                reject(err);
            })
        })
    }


    Contracts.remoteMethod(
        'editContract', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'contractData', type: 'object', required: true, http: { source: 'body' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Contracts.editContract = function(contractData, cb) {
        if (!isNull(contractData["meta"])) {
            contractData = contractData["meta"];
        }
        
        if(isNull(contractData["contractId"])){
            return cb(new HttpErrors.BadRequest('Please Provide Contract ID', { expose: false }));
        }

        let bizPayload = {};
        if(!isNull(contractData["metaData"])){
            bizPayload = contractData["metaData"];
        }

        contractData["bizPayload"] = bizPayload;

        let updateJson = null;

        if(!isNull(contractData["receivers"])){

            let _receivers = []; let lcount = 1;
            asyncFunc.each(contractData["receivers"],function(item,clb){
                item["permission"] = "SIGN_ONLY";
                item["sequence"] = lcount;
                item["hostEmailId"] = "EMAIL_ID_OF_INPERSON_ADMINISTRATOR";
                item["allowNameChange"] = true;
                _receivers.push(item); 
                lcount++;
                 clb();
            },function(){
                contractData["receivers"] = _receivers;
                updateJson["receivers"] = _receivers;
            })
        }


        if(!isNull(contractData["contractName"])){
            updateJson["contractName"] = contractData["contractName"];
        }
        if(!isNull(contractData["templateIds"])){
            if(isArray(contractData["templateIds"])){
                if( (contractData["templateIds"]).length ){
                    updateJson["originalTemplateIds"] = contractData["templateIds"];
                }
            }
        }

        if(!isNull(contractData["customFields"])){
            if(isArray(contractData["customFields"])){
                if( (contractData["customFields"]).length ){
                    updateJson["fields"] = contractData["customFields"];
                }
            }
        }

        Contracts.findById(contractData["contractId"]).then(contractInfo=>{
            if(isValidObject(contractInfo)){
                if(!isNull(updateJson)){
                    if(!isNull(updateJson["originalTemplateIds"])){
                        let templateIds = [];

                        Contracts.app.models.Templates.find({"where":{"templateId":{"inq":updateJson["originalTemplateIds"]}},"fields":["template"]}).then(templatesList=>{
                            if(isArray(templatesList)){
                                asyncFunc.each(templatesList,function(item,clb){
                                    templateIds.push(item["template"]["templateId"]);
                                    clb();
                                },function(){
                                    editContract(contractData,updateJson,templateIds,contractInfo).then(res=>{
                                        cb(null,res);
                                    }).catch(err=>{
                                        cb(new HttpErrors.InternalServerError((err), { expose: false }));
                                    })
                                });

                            }else{
                                return cb(new HttpErrors.BadRequest('Please Provide Valid Template IDs', { expose: false }));
                            }
                        }).catch(err=>{
                            cb(new HttpErrors.InternalServerError((err), { expose: false }));
                        })

                    }else{
                        contractInfo.updateAttributes(updateJson).then(res=>{
                            cb(null,res);
                        }).catch(err=>{

                        })
                    }
                }else{
                    cb(null,contractInfo);
                }
            }else{
                return cb(new HttpErrors.BadRequest('Please Provide Valid Contract ID', { expose: false }));
            }
        }).catch(err=>{
            return cb(new HttpErrors.InternalServerError((err), { expose: false }));
        })
    }

    async function editContract(contractData,updateJson,templateIds,contractInfo){
        return new Promise((resolve,reject)=>{
            updateJson["templateIds"] = templateIds;
            contractInfo.updateAttributes(updateJson).then(res=>{
                resolve(res);
            }).catch(err=>{
                reject(err);
            })

        })
    }

    Contracts.remoteMethod(
        'createAndSendContract', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'contractData', type: 'object', required: true, http: { source: 'body' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Contracts.createAndSendContract = function(contractData, cb) {
        Contracts.createContract(contractData,function(err,res){
            if(err){
                return cb(new HttpErrors.InternalServerError((err), { expose: false }));
            }else{
                sendContract(contractData,res,true).then(response=>{
                    cb(null,response);
                }).catch(err=>{
                    return cb(new HttpErrors.InternalServerError(err, { expose: false }));
                })
            }
        });
    }


    async function sendContract(contractRequestBody,contractInfo,sendNow){
        return new Promise((resolve,reject)=>{
            let contractJson = {
                "folderName": contractInfo["contractName"] ,
                "templateIds": contractInfo["templateIds"],
                "createEmbeddedSendingSession":true,
                "fixRecipientParties":true,
                "fixDocuments":true,
                "sendSuccessUrl": (!isNull(contractRequestBody["successUrl"]))?contractRequestBody["successUrl"]:"" ,
                "sendErrorUrl": (!isNull(contractRequestBody["errorUrl"]))?contractRequestBody["errorUrl"]:"" ,
                "themeColor": (!isNull(contractRequestBody["themeColor"]))?contractRequestBody["themeColor"]:"" ,
                "parties": contractInfo["receivers"],
                "fields": contractInfo["fields"] ,
                "hideDeclineToSign": true,
                "hideMoreAction": true,
                "hideAddPartiesOption": true
            };

            if(sendNow){ contractJson["sendNow"] = true; }
            else{
                contractJson["sendNow"] = false;
            }

            eSignGenieAPISHandler.funCallApi(ESIGN_TERMS["SEND_CONTRACT"],contractJson,"POST").then(templateResponse=>{
                //cb(null,templateResponse);
                if(templateResponse["success"]){
                    if(templateResponse["body"]["result"] === "success"){
                        let folderAccessURLAdmin = templateResponse["body"]["embeddedSessionURL"];
                        let folderAccessURLClient = templateResponse["body"]["folder"]["folderRecipientParties"][0]["folderAccessURL"];
                        let folderId = templateResponse["body"]["folder"]["folderId"];

                        contractInfo.updateAttributes({"toolContractId": folderId ,"contractUrlForAdmin":folderAccessURLAdmin,"contractUrlForClient":folderAccessURLClient,"metaData": templateResponse["body"] }).then(res=>{
                            resolve(templateResponse["body"]);
                        }).catch(err=>{
                            reject(err);
                        })
                    }else{
                        reject(templateResponse["body"]["error_description"]);
                    }
                }else{
                    reject(templateResponse["body"]);
                }
            }).catch(err=>{
                reject(err);
                //cb(new HttpErrors.InternalServerError((err), { expose: false }));
            })

        });
    }


    Contracts.remoteMethod(
        'sendContract', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'contractData', type: 'object', required: true, http: { source: 'body' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Contracts.sendContract = function(contractData, cb) {
        if (!isNull(contractData["meta"])) {
            contractData = contractData["meta"];
        }
        
        if(isNull(contractData["contractId"])){
            return cb(new HttpErrors.BadRequest('Please Provide Contract ID', { expose: false }));
        }

        Contracts.findById(contractData["contractId"]).then(contractInfo=>{
            sendContract(contractData,contractInfo,true).then(res=>{
                cb(null,res);
            }).catch(err=>{
                cb(new HttpErrors.InternalServerError((err), { expose: false }));
            })
        }).catch(err=>{
            cb(new HttpErrors.InternalServerError((err), { expose: false }));
        })

    }


    Contracts.remoteMethod(
        'downloadContract', {
            http: {
                verb: 'get'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'contractId', type: 'string', required: true, http: { source: 'query' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Contracts.downloadContract = function(contractId, cb) {
        Contracts.findById(contractId).then(contractInfo=>{
            let apiUrl = ESIGN_TERMS["DOWNLOAD_CONTRACT"];
            apiUrl = String(apiUrl).replace("{{FOLDER_ID}}", contractInfo["metaData"]["folder"]["folderId"] );

            eSignGenieAPISHandler.funCallApi(apiUrl,{},"GET").then(templateResponse=>{
                //cb(null,templateResponse);
                if(templateResponse["success"]){
                    if(templateResponse["body"]["result"] === "success"){
                        console.log(templateResponse["body"]);
                        cb(null,templateResponse["body"]);
                    }else{
                        reject(templateResponse["body"]["error_description"]);
                    }
                }else{
                    reject(templateResponse["body"]);
                }
            }).catch(err=>{
                reject(err);
            })
        }).catch(err=>{
            cb(new HttpErrors.InternalServerError((err), { expose: false }));
        })
    }


    Contracts.remoteMethod(
        'deleteContract', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'contractData', type: 'object', required: false, http: { source: 'body' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Contracts.deleteContract = function(contractData, cb) {
        if (!isNull(contractData["meta"])) {
            contractData = contractData["meta"];
        }
        
        if(isNull(contractData["contractId"])){
            return cb(new HttpErrors.BadRequest('Please Provide Contract ID', { expose: false }));
        }

        Contracts.findById(contractData["contractId"]).then(contractInfo=>{
            contractInfo.updateAttributes({"isActive":false}).then(res=>{
                cb(null,res);
            }).catch(err=>{
                cb(new HttpErrors.InternalServerError((err), { expose: false }));
            })
        }).catch(err=>{
            cb(new HttpErrors.InternalServerError((err), { expose: false }));
        })
    }


    Contracts.remoteMethod(
        'listContracts', {
            http: {
                verb: 'post'
            },
            description: ["This request will provide transaction details"],
            accepts: [
                { arg: 'contractData', type: 'object', required: false, http: { source: 'body' }},
            ],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Contracts.listContracts = function(contractData, cb) {
        if (!isNull(contractData["meta"])) {
            contractData = contractData["meta"];
        }
        
        if(isNull(contractData["businessId"])){
            return cb(new HttpErrors.BadRequest('Please Provide Business ID', { expose: false }));
        }

        Contracts.find({"where":{"businessId": contractData["businessId"]},"fields":["contractId","contractName"]}).then(allContracts=>{
            cb(null,allContracts);
        }).catch(err=>{
            cb(new HttpErrors.InternalServerError((err), { expose: false }));
        })
    }


    Contracts.remoteMethod(
        'decodeWebHook', {
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

    Contracts.decodeWebHook = function(webHookData, cb) {
        if(!isNull(webHookData["data"])){
            if(!isNull(webHookData["data"]["folder"])){
                if(!isNull(webHookData["data"]["folder"]["folderId"])){
                    let folderId = webHookData["data"]["folder"]["folderId"];
                    webHookData["event_name"] = String(webHookData["event_name"]).replace("folder","contract");

                    Contracts.findOne({"where":{"toolContractId": folderId }}).then(contractInfo=>{
                        if(isValidObject(contractInfo)){
                            let businessId = contractInfo["businessId"];
                            Contracts.app.models.BizProfile.findOne({"where":{"businessId":businessId}}).then(bizData=>{
                                let webhookUrl = bizData["webhookUrl"];
                                if(!isNull(webhookUrl)){
                                    webHookData["contractId"] = contractInfo["contractId"];
                                    webHookData["bizPayload"] = contractInfo["bizPayload"];
                                    axios.post(webhookUrl, webHookData)
                                      .then(function (response) {
                                        console.log(response);
                                        cb(null,{"success":true});
                                      })
                                      .catch(function (error) {
                                        cb(null,{"success":true});
                                      });
                                }else{
                                    cb(null,{"success":true});
                                }
                            })
                        }else{
                            cb(null,{"success":true});
                        }
                    })
                }else{
                    cb(null,{"success":true});
                }
            }else{ cb(null,{"success":true}); }
        }else{
            cb(null,{"success":true});
        }

    }




};
