require("dotenv").config();

module.exports = {
  port: process.env.PORT || 8080,
  dbUrl: process.env.DB,
  jwt: process.env.JWT_SECRET,
  //Aws Bucket
  bucketRegion: process.env.AWS_REGION,
  bucketAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  bucketSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucketName: process.env.AWS_BUCKET_NAME,
  authServiceBaseUrl: process.env.AUTH_SERVICE_BASE_URL,
  crmServiceBaseUrl: process.env.CRM_SERVICE_BASE_URL,
  networkId: process.env.NETWORK_ID,
  appId: process.env.APP_ID,
};
