//Model
const Receipt = require("../../../models/finance/receipt.model.js");
//Response and errors
const {
  error500,
  error409,
  error404,
  error400,
} = require("../../../services/helpers/errors.js");
const { status200, success } = require("../../../services/helpers/response.js");
const axios = require("axios");
const config = require("../../../config/index.js");

//Create an receipt
const createAnReceipt = async (req, res, next) => {
  const { invoice, client, receiptNo } = req.body;
  try {
    const receiptExist = await Receipt.findOne({ receiptNo });

    if (receiptExist) {
      return error409(res, "Receipt number already exist");
    }

    await Receipt.create({
      ...req.body,
      clientId: client,
      invoiceId: invoice,
      createdById: req.userId,
    });

    return status200(res, `Receipt created successfully`);
  } catch (err) {
    return next(err);
  }
};

//Get all receipts
const allReceipt = async (req, res, next) => {
  const { type, text, searchMode, data, page = 1, pageSize = 10 } = req.query;

  //Query object
  let query = {};

  // if (type) {
  //   query.type = type;
  // }

  // if (text) {
  //   query.name = { $regex: text, $options: "i" };
  // }

  try {
    async function fetchAllUsers() {
      try {
        const response = await axios.get(
          `${config.authServiceBaseUrl}/users/get_many?network_id=${config.networkId}`,
          {
            headers: {
              Authorization: `Bearer ${req.token}`,
            },
          }
        );
        if (
          response &&
          response?.data &&
          Array.isArray(response?.data) &&
          response?.data?.length > 0
        ) {
          if (
            Array.isArray(response?.data[0]) &&
            response?.data[0]?.length > 0
          ) {
            return response?.data[0];
          } else return [];
        } else return [];
      } catch (err) {
        if (err.response.status === 401) {
          throw new Error("Invalid token for Auth Service");
        }
        throw new Error("Error in Auth Service");
      }
    }
    async function attachUserDetails(receipt, allUsers) {
      const findUser = (userId) => {
        const user = allUsers.find((user) => user.user_id === userId);
        if (user) {
          return {
            first_name: user?.first_name,
            last_name: user?.last_name,
            email: user?.email,
            user_id: user?.user_id,
          };
        }
        return null;
      };

      const createdByUser = findUser(receipt?.createdById);
      return {
        ...receipt,
        createdByUser: createdByUser,
      };
    }

    const receipts = await Receipt.find(query)
      .select("-__v")
      .lean()
      .populate({
        path: "invoiceId",
        select: "-__v -materials",
        populate: {
          path: "clientId",
          select: "name",
          populate: {
            path: "routeId",
            select: "name",
          },
        },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await Receipt.countDocuments(query);
    const totalPages = Math.ceil(total / pageSize);

    //Modify response with Auth Service Response
    const allUsers = await fetchAllUsers();

    if (!allUsers.length) {
      return error404(res, "No users returned from Auth Service");
    }

    const modifiedReceipts = await Promise.all(
      receipts.map((receipt) => attachUserDetails(receipt, allUsers))
    );

    const response = {
      receipts: modifiedReceipts,
      total,
      totalPages,
    };
    return success(res, "200", "Success", response);
  } catch (err) {
    if (err.message === "Error in Auth Service") {
      return error500(res, err.message);
    }
    if (err.message === "Invalid token for Auth Service") {
      return error500(res, err.message);
    }
    return next(err);
  }
};

//Delete receipt
const deleteReceipt = async (req, res, next) => {
  const { id } = req.params;
  try {
    const existReceipt = await Receipt.findById(id);
    if (!existReceipt) {
      return error404(res, "Receipt not found");
    }
    await Receipt.deleteOne({ _id: id });
    return status200(res, `Receipt deleted`);
  } catch (err) {
    return next(err);
  }
};

//Change status
const changeStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const statusUpdated = await Receipt.findByIdAndUpdate(id, {
      status,
    });
    if (!statusUpdated) {
      return error404(res, "Receipt not found");
    }
    return status200(res, `Receipt status changed to ${status}`);
  } catch (err) {
    return next(err);
  }
};

//Receipt detail
const receiptDetail = async (req, res, next) => {
  const { id } = req.params;
  try {
    const receiptDetail = await Receipt.findById(id)
      .populate("clientId")
      .populate("invoiceId");
    if (!receiptDetail) {
      return error404(res, "Receipt not found");
    }
    return success(res, "200", "Success", receiptDetail);
  } catch (err) {
    return next(err);
  }
};

//Edit receipt
const editReceipt = async (req, res, next) => {
  const { id } = req.params;
  const { receiptDate, amount } = req.body;
  try {
    const receiptExist = await Receipt.findByIdAndUpdate(id, {
      receiptDate,
      amount,
    });

    if (!receiptExist) {
      return error404(res, "Receipt not found");
    }
    return status200(res, `Receipt edited successfully`);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createAnReceipt,
  allReceipt,
  deleteReceipt,
  changeStatus,
  receiptDetail,
  editReceipt,
};
