module.exports = {
    default_error_handler(err, req, res, next) {
        console.error(err);
        res.status(500).send({ message: err.toString() });
    }
}