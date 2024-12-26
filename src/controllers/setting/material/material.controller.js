//Model
const Material = require("../../../models/setting/material.model");
const Loading = require("../../../models/inventory/loading.model.js");
const WarehouseMaterial = require("../../../models/inventory/warehouse/warehouseMaterial.model.js");
//Response and errors
const {
  error500,
  error409,
  error404,
  error400,
} = require("../../../services/helpers/errors.js");
const { status200, success } = require("../../../services/helpers/response.js");
//helpers
const {
  toPlainObject,
  JSONParser,
} = require("../../../services/helpers/commonHelpers.js");
const {
  uploadFileToBucket,
  deleteObjFromBucket,
} = require("../../../services/helpers/awsHelper.js");
const axios = require("axios");
const mongoose = require("mongoose");
const config = require("../../../config/index.js");

//Add material
const addMaterial = async (req, res, next) => {
  const file = toPlainObject(req.files);
  const body = toPlainObject(req.body);
  const { name } = body;
  try {
    const alreadyExists = await Material.findOne({ name }).lean();

    if (alreadyExists) {
      return error409(res, "Material with this name already exists");
    }

    let picture = {};
    let documents = [];

    if (file.file && file.file.length > 0) {
      const picUploadParams = {
        Bucket: config.bucketName,
        Key: `material/picture/${Date.now()}_${file.file[0].originalname}`,
        Body: file.file[0].buffer,
        ContentType: file.file[0].mimetype,
      };
      const pictureUploadResult = await uploadFileToBucket(picUploadParams);

      picture = {
        name: file.file[0].originalname,
        format: file.file[0].mimetype,
        location: pictureUploadResult.location,
        key: pictureUploadResult.key,
      };
    }

    if (file.files && file.files.length > 0) {
      for (const docFile of file.files) {
        const docUploadParams = {
          Bucket: config.bucketName,
          Key: `material/document/${Date.now()}_${docFile.originalname}`,
          Body: docFile.buffer,
          ContentType: docFile.mimetype,
        };
        const docUploadResult = await uploadFileToBucket(docUploadParams);

        documents.push({
          name: docFile.originalname,
          format: docFile.mimetype,
          location: docUploadResult.location,
          key: docUploadResult.key,
        });
      }
    }

    await Material.create({
      ...req.body,
      picture,
      documents,
    });

    return status200(res, `Material created successfully`);
  } catch (err) {
    return next(err);
  }
};

//Get all materials
const allMaterials = async (req, res, next) => {
  const { page = 1, pageSize = 10 } = req.query;
  try {
    let query = {};
    const material = await Material.find(query)
      .select("-__v")
      .lean()
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await Material.countDocuments(query);
    const totalPages = Math.ceil(total / pageSize);

    const response = {
      material,
      total,
      totalPages,
    };

    return success(res, "200", "Success", response);
  } catch (err) {
    return next(err);
  }
};

//Get all materials for dropdown
const allMaterialsForDropdown = async (req, res, next) => {
  try {
    const material = await Material.find({ status: "Active" })
      .select("-__v -documents -picture")
      .lean();

    return success(res, "200", "Success", material);
  } catch (err) {
    return next(err);
  }
};

//Edit material
const editMaterial = async (req, res, next) => {
  const { id } = req.params;
  const file = toPlainObject(req.files);
  const body = toPlainObject(req.body);
  let documentsToRemove;
  if (body.documentsToRemove) {
    documentsToRemove = JSONParser(body.documentsToRemove);
  }
  try {
    const materialExists = await Material.findById(id);
    if (!materialExists) {
      return error404(res, "Material not found");
    }

    if (documentsToRemove && documentsToRemove.length > 0) {
      for (const docId of documentsToRemove) {
        const document = materialExists.documents.id(docId);
        if (document) {
          await deleteObjFromBucket({
            Bucket: config.bucketName,
            Key: document.key,
          });
          document.deleteOne();
        }
      }
      await materialExists.save();
    }

    if (file && (file?.files?.length || file?.file?.length)) {
      if (file?.file?.length) {
        //Delete from bucket
        await deleteObjFromBucket({
          Bucket: config.bucketName,
          Key: materialExists.picture.key,
        });
        const picUploadParams = {
          Bucket: config.bucketName,
          Key: `material/picture/${Date.now()}_${file.file[0].originalname}`,
          Body: file.file[0].buffer,
          ContentType: file.file[0].mimetype,
        };
        //Upload to bucket
        const pictureUploadResult = await uploadFileToBucket(picUploadParams);
        await Material.findByIdAndUpdate(id, {
          picture: {
            name: file.file[0].originalname,
            format: file.file[0].mimetype,
            location: pictureUploadResult.location,
            key: pictureUploadResult.key,
          },
        });
      }

      if (file?.files?.length) {
        for (const fileItem of file?.files) {
          const docUploadParams = {
            Bucket: config.bucketName,
            Key: `material/document/${Date.now()}_${file.originalname}`,
            Body: fileItem.buffer,
            ContentType: fileItem.mimetype,
          };
          const uploadResult = await uploadFileToBucket(docUploadParams);
          materialExists.documents.push({
            name: fileItem.originalname,
            format: fileItem.mimetype,
            location: uploadResult.location,
            key: uploadResult.key,
          });
          await materialExists.save();
        }
      }
    }
    await Material.findByIdAndUpdate(id, { ...req.body });
    return status200(res, `Material edited successfully`);
  } catch (err) {
    return next(err);
  }
};

//Delete material
const deleteMaterial = async (req, res) => {
  const { id } = req.params;
  try {
    const materialExists = await Material.findById(id);

    if (!materialExists) {
      return error404(res, "Material not found");
    }

    if (materialExists.picture && materialExists.picture.key) {
      await deleteObjFromBucket({
        Bucket: config.bucketName,
        Key: materialExists.picture.key,
      });
    }

    if (materialExists.documents && materialExists.documents.length > 0) {
      for (const doc of materialExists.documents) {
        await deleteObjFromBucket({
          Bucket: config.bucketName,
          Key: doc.key,
        });
      }
    }

    await materialExists.deleteOne({ _id: id });
    return status200(res, `Material deleted successfully`);
  } catch (err) {
    return next(err);
  }
};

//Change status
const changeStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const statusUpdated = await Material.findByIdAndUpdate(id, {
      status,
    });
    if (!statusUpdated) {
      return error404(res, "Material not found");
    }
    return status200(res, `Material status changed to ${status}`);
  } catch (err) {
    return next(err);
  }
};

//Materials based on route match
const routeBasedMaterials = async (req, res, next) => {
  //assignee id in the req.params
  const { id } = req.params;
  try {
    const loadings = await Loading.find().select("-__v").lean();

    if (!loadings.length) {
      return res
        .status(404)
        .json({ message: "No loadings found for the assignee" });
    }

    const vehicleIds = loadings.map((loading) => loading.vehicleId);

    const materials = await WarehouseMaterial.find({
      warehouseId: { $in: vehicleIds },
    }).populate({
      path: "materialId",
      select: "name description",
    });

    return success(res, "200", "Success", materials);
  } catch (err) {
    return next(err);
  }
};

//Sync material
const syncMaterial = async (req, res, next) => {
  try {
    let page = 1;
    const pageSize = 500;
    let totalPages;
    let recordsSynced = 0;

    while (true) {
      let response;
      try {
        response = await axios.get(`${config.crmServiceBaseUrl}/getMaterials`, {
          headers: {
            Authorization: `Bearer ${req.token}`,
          },
          params: {
            page,
            pageSize,
          },
        });
      } catch (err) {
        return new Error("Server error");
      }

      if (response.data) {
        const bulkOps = response.data.data.map((materialData) => {
          const { _id, ...otherData } = materialData;
          console.log("The otherData", otherData);
          return {
            updateOne: {
              filter: { _id: new mongoose.Types.ObjectId(_id) },
              update: { $set: otherData },
              upsert: true,
            },
          };
        });

        await Material.bulkWrite(bulkOps, { ordered: false });
        //Just to check the record count
        const itemsProcessed = response.data.data.length;
        recordsSynced += itemsProcessed;
        totalPages = response.data.totalPages;
        if (page >= totalPages) break;
      }
      page++;
    }
    return status200(res, `Synced successfully`);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  addMaterial,
  allMaterials,
  allMaterialsForDropdown,
  editMaterial,
  deleteMaterial,
  changeStatus,
  routeBasedMaterials,
  syncMaterial,
};
