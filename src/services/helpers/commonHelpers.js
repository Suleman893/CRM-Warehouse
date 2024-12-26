const toPlainObject = (body) => {
  return Object.assign({}, body);
};

const JSONParser = (jsonString) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Invalid JSON string provided:", error);
  }
};

const prototypeRemover = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) => prototypeRemover(item));
  } else if (data && typeof data === "object") {
    const plainObject = {};
    Object.assign(plainObject, data);

    Object.keys(plainObject).forEach((key) => {
      plainObject[key] = prototypeRemover(plainObject[key]);
    });

    return plainObject;
  }
  return data;
};

module.exports = { toPlainObject, JSONParser, prototypeRemover };
