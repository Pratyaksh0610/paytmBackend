require("dotenv").config();

const JWT_SECRET = process.env.REACT_APP_JWT_SECRET;
console.log(JWT_SECRET);
module.exports = JWT_SECRET;
