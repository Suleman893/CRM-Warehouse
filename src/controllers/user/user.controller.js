//Responses and errors
const { error500 } = require("../../services/helpers/errors");
const { status200, success } = require("../../services/helpers/response");
const axios = require("axios");
//helpers
const config = require("../../config");

//Get all the users roles for modals/popup's
const getUsersRoles = async (req, res, next) => {
  try {
    const { role, name } = req.query;

    let url = `${config.authServiceBaseUrl}/user_apps/get_user_roles?app_id=${config.appId}`;

    //If have user_role
    if (role?.length) {
      url += `&app_role=${role}`;
    }
    if (name?.length) {
      url += `&user_name=${name}`;
    }

    let usersRoles = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${req.token}`,
      },
    });
    usersRoles = usersRoles.data;

    //For structuring the data for frontend
    const groupedUsers = usersRoles.reduce((acc, user) => {
      const role = user.user_role;
      if (!acc[role]) {
        acc[role] = { role: role, data: [] };
      }
      acc[role].data.push({
        user_id: user.user_id,
        user_name: user.user_name,
        user_role: user.user_role,
        user_email: user.email,
        user_role_description: user.role_description,
      });
      return acc;
    }, {});

    const result = Object.values(groupedUsers).map((group) => {
      return {
        role: group.role,
        data: group.data,
      };
    });

    return success(res, "200", "Success", result);
  } catch (err) {
    return error500(res, "Error in Auth Service");
  }
};

// //Get all the users complete information
// const getUsers = async (req, res, next) => {
//   try {
//     let users = await axios.get(
//       `${process.env.AUTH_SERVICE_BASE_URL}/users/get_many?network_id=${process.env.NETWORK_ID}`,
//       {
//         headers: {
//           Authorization: `Bearer ${req.token}`,
//         },
//       }
//     );
//     users = users.data;
//     return success(res, "200", "Success", users);
//   } catch (err) {
//     return next(err)
//   }
// };

module.exports = {
  getUsersRoles,
  // getUsers,
};
