const jwt = require("jsonwebtoken");

const config = require('#root/config/auth.config')

module.exports = {
    verify_token(req, res, next) {
        let token = req.headers["x-access-token"];

        jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                return res.status(401).send({
                    message: "Access token is invalid!"
                });
            }
            req.user_id = decoded.id;
            next();
        });
    }
}