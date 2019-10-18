let configFile = './eSignConfig.json';
console.log(process.env.NODE_ENV);

switch (process.env.NODE_ENV) {
    case "development":
        configFile = './eSignConfig.development.json';
    break;
    case "alpha":
        configFile = './eSignConfig.alpha.json';
    break;
    case "production":
        configFile = './eSignConfig.production.json';
    break;
    default:
        configFile = './eSignConfig.localhost.json'; //If not exists make one
    break;
}

var config = require(configFile);

const eSignBaseURL = "https://www.esigngenie.com/esign/api/";

exports.ESIGN_APIS = {
    "GET_ACCESS_TOKEN": eSignBaseURL+"oauth2/access_token",
    "CREATE_TEMPLATE": eSignBaseURL+"templates/createtemplate",
    "FETCH_ALL_TEMPLATES": eSignBaseURL+"templates/list",
    "FETCH_TEMPLATE_DETAILS": eSignBaseURL+"templates/mytemplate?templateId={{TEMPLATE_ID}}",
    "SEND_CONTRACT": eSignBaseURL+"templates/createFolder",
    "CREATE_CONTRACT": eSignBaseURL+"templates/createFolder",
    "DOWNLOAD_CONTRACT": eSignBaseURL+"folders/download?folderId={{FOLDER_ID}}",
}

exports.ESIGN_TERMS = {
    "CREATE_ACCOUNT": "CREATE_ACCOUNT",
    "CREATE_TEMPLATE":"CREATE_TEMPLATE",
    "SEND_CONTRACT": "SEND_CONTRACT",
    "CREATE_CONTRACT": "CREATE_CONTRACT",
    "DOWNLOAD_CONTRACT": "DOWNLOAD_CONTRACT"
}

exports.config = config;