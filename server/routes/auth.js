const express = require('express');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');

const mysql = require('#root/dbs/mysql');
const config = require('#root/config/auth.config')

const router = express.Router();

router.post('/signup', function (req, res, next) {
    mysql.query(`
        insert ignore
        users(email, password) 
        value(?,?)
    `, [req.body.email, bcrypt.hashSync(req.body.password, 8)]).then(status => {
        user_id = status.insertId;
        if (!user_id) {
            res.status(409).send({
                message: "User already exists!"
            })
            return;
        }
        res.status(201).send({
            message: "User is successfully signed up."
        })
    })
});

router.post('/signin', function (req, res, next) {
    mysql.query(`
        select *
        from users
        where email = ?
    `, [req.body.email]).then(result => {
        user = result[0];

        if (
            !user ||
            !bcrypt.compareSync(
                req.body.password,
                user.password
            )
        ) {
            return res.status(401).send({ message: "No such a user!" });
        }

        let token = jwt.sign({ id: user.id }, config.secret, {
            expiresIn: 86400 // 24 hours
        });

        res.status(200).send({
            user: {
                id: user.id,
                email: user.email
            },
            accessToken: token
        })
    })
});

module.exports = router;