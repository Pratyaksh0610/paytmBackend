const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ msg: "Something is wrong with token" });
  }

  const token = authHeader.split(" ")[1];
  // console.log(token);

  try {
    const decodedToken = jwt.decode(token);
    if (decodedToken && decodedToken.exp) {
      const expirationTime = decodedToken.exp;
      const currentTime = Math.floor(Date.now() / 1000); // Convert milliseconds to seconds

      if (currentTime > expirationTime) {
        res.status(400).json({
          msg: "Token expired",
        });
        return;
      }
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(403).json({ msg: "Error in token" });
  }
};

module.exports = authMiddleware;
