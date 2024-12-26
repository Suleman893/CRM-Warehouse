const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const config = require("../../config");

//Upload to Bucket
const uploadFileToBucket = async (uploadParams) => {
  const s3Client = new S3Client({
    credentials: {
      accessKeyId: config.bucketAccessKeyId,
      secretAccessKey: config.bucketSecretAccessKey,
    },
    region: config.bucketRegion,
  });

  try {
    const command = new PutObjectCommand(uploadParams);
    const response = await s3Client.send(command);
    const key = uploadParams.Key;
    const location = `https://${uploadParams.Bucket}.s3.${config.bucketRegion}.amazonaws.com/${uploadParams.Key}`;
    return {
      ...response,
      key,
      location,
    };
  } catch (err) {
    throw err;
  }
};

//Delete from bucket
const deleteObjFromBucket = async (deleteParams) => {
  const s3Client = new S3Client({
    credentials: {
      accessKeyId: config.bucketAccessKeyId,
      secretAccessKey: config.bucketSecretAccessKey,
    },
    region: config.bucketRegion,
  });
  try {
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
  } catch (err) {
    throw err;
  }
};

module.exports = { uploadFileToBucket, deleteObjFromBucket };
