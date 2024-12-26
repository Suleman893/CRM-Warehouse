const jwt = require("jsonwebtoken");
const config = require("../config");

const permissionHandler = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(403).json({ message: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];

    //Verify and decode the token, check expiry of token
    jwt.verify(token, config.jwt, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res
            .status(401)
            .json({ message: "Token has expired. Please login again." });
        }
        return res.status(401).json({ message: "Token is expired or invalid" });
      }

      const modelPermissions = decoded.permissions.model_permissions;
      // console.log("The modelPermissions", modelPermissions);
      // console.log("The req.path", req.path);
      // console.log("The req.baseUrl", req.baseUrl);

      let path = req.baseUrl + req.path;

      path = path.replace(/\/[a-fA-F0-9-]{24,}/g, "");
      // console.log("The path", path);

      const getModelFromPath = (baseUrl) => {
        const segments = baseUrl.split("/").filter(Boolean);
        // console.log("The segments", segments);
        if (segments.length > 4) {
          return `${segments[3]}/${segments[4]}`; // For multi-level baseURL's example: 'finance/invoice', 'inventory/warehouse', etc.
        } else if (segments.length > 3) {
          return `${segments[3]}`; // For single baseURl's example: 'client', 'task', etc.
        }

        return null;
      };

      const model = getModelFromPath(req.baseUrl);
      // console.log("The model", model);
      if (!model || !modelPermissions[model]) {
        return res.status(403).json({
          message: "Access denied, insufficient permissions for this action",
        });
      }

      const endpointAction = path.split("/").pop();
      // console.log("The endpointAction", endpointAction);
      // console.log("The modelPermissions[model]", modelPermissions[model]);

      // if (!modelPermissions[model].includes(endpointAction)) {
      //   return res.status(403).json({
      //     message: "Access denied, insufficient permissions for this action",
      //   });
      // }

      const hasPermission = modelPermissions[model].some((permission) => {
        return (
          permission === endpointAction ||
          permission.endsWith(`/${endpointAction}`)
        );
      });

      if (!hasPermission) {
        return res.status(403).json({
          message: "Access denied, insufficient permissions for this action",
        });
      }

      req.userId = decoded.user_id;
      req.role = decoded.permissions.role_name;
      req.token = token;

      return next();
    });
  } catch (err) {
    return res.status(500).json({ message: "Error checking permissions", err });
  }
};

module.exports = { permissionHandler };
