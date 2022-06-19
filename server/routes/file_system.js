const express = require('express');
const path = require('path');
const shortid = require('shortid');
const fs = require('fs');

const mysql_fs_service = require('#root/services/mysql_fs_service');
const mongo_fs_service = require('#root/services/mongo_fs_service');
var { verify_token } = require('#root/middlewares/jwt_auth');

const FS_DIR = path.join(__dirname, "../storage/fs")

// // **** test - disable auth ****
// verify_token = (req, res, next) => { req.user_id = 1; next(); }

const dbSelectionRouter = express.Router();
const fsRouter = express.Router();

const set_db = (req, res, next) => {
    switch (req.params.db) {
        case 'mysql':
            req.fs = mysql_fs_service
            break;
        case 'mongo':
            req.fs = mongo_fs_service
            break;
        default:
            throw new Error("Unsupported database!");
    }
    next()
}

const verify_disk_ownership = (req, res, next) => {
    req.fs.disk(req.params.disk_id)
        .then(disk => {
            if (!disk) {
                return res.status(404).send({
                    message: "The disk is not found!"
                });
            }
            if (disk.user_id !== req.user_id) {
                return res.status(403).send({
                    message: "Unauthorized to access the disk!"
                });
            }
            next();
        })
        .catch(next)
}

const verify_fso_ownership = (req, res, next) => {
    req.fs.object_with_owner_id(req.params.fso_id)
        .then(fso => {
            if (!fso) {
                return res.status(404).send({
                    message: "The fso is not found!"
                });
            }
            if (fso.user_id !== req.user_id) {
                return res.status(403).send({
                    message: "Unauthorized access to the fso!"
                });
            }
            next();
        })
        .catch(next)
}

dbSelectionRouter.use('/:db', [
    verify_token,
    set_db,
    fsRouter
]);

fsRouter.use('/disks/:disk_id', verify_disk_ownership)
fsRouter.use('/fsos/:fso_id', verify_fso_ownership)
fsRouter.use('/folders/:fso_id', verify_fso_ownership)
fsRouter.use('/files/:fso_id', verify_fso_ownership)


// SHARED HANDLERS

const handleNewFile = async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send({
            message: 'No files were uploaded!'
        });
    }
    let file = req.files.file;
    if (!file) {
        return res.status(400).send({
            message: "Wrong key used. It should be just 'file'!"
        });
    }

    let url_basename, absolute_url;
    // while (true) {
    url_basename = shortid.generate() + '~' + req.user_id + '~' + file.name.replace(/[^a-z0-9_\-\.]/gi, '');
    absolute_url = path.join(FS_DIR, url_basename);
    //     if(!fs.existsSync(absolute_url)) break;
    // }

    file.mv(absolute_url, function (err) {
        if (err) {
            fs.rm(file.tempFilePath, err => err && console.error(err));
            next(err);
        }
        else {
            req.fs.new_file(
                req.params.disk_id || null,
                req.params.parent_id || null,
                file.name,
                file.size,
                url_basename
            )
                .then(file => res.json(file))
                .catch(next);
        }
    })
}
const handleNewFolder = (req, res, next) => {
    req.fs.new_folder(
        req.params.disk_id || null,
        req.params.parent_id || null,
        req.body.name
    )
        .then(folder => res.json(folder))
        .catch(next);
}


// ROUTES

fsRouter.get('/disks', (req, res, next) => {
    req.fs.disks(req.user_id)
        .then(disks => res.json(disks))
        .catch(next);
});

fsRouter.post('/disks', (req, res, next) => {
    req.fs.new_disk(
        req.user_id,
        req.body.name
    )
        .then(disk => res.json(disk))
        .catch(next);
});

fsRouter.get('/disks/:id', (req, res, next) => {
    req.fs.disk_root_content(req.params.id)
        .then(results => res.json(results))
        .catch(next);
});

fsRouter.get('/disks/:id/deleted', (req, res, next) => {
    req.fs.deleted_content(req.params.id)
        .then(results => res.json(results))
        .catch(next);
});

fsRouter.patch('/disks/:id/rename', (req, res, next) => {
    req.fs.rename_disk(req.params.id, req.body.new_name)
        .then(renamed => res.json({
            renamed,
            ...(renamed && {
                update: {
                    id: req.params.id,
                    name: req.body.new_name
                }
            })
        }))
        .catch(next);
});

fsRouter.delete('/disks/:id', (req, res, next) => {
    req.fs.delete_disk(req.params.id)
        .then(deleted => res.json({
            deleted
        }))
        .catch(next);
});

fsRouter.post('/disks/:disk_id/folders', handleNewFolder);

fsRouter.post('/disks/:disk_id/files', handleNewFile)

fsRouter.patch('/fsos/:id/recover', (req, res, next) => {
    req.fs.recover_object(req.params.id)
        .then(({ recovered, rooted }) => res.json({
            recovered,
            ...(recovered && {
                update: {
                    id: req.params.id,
                    deleted_at: null,
                    ...(!!rooted && {
                        parent_id: null
                    })
                }
            })
        }))
        .catch(next);
});

fsRouter.patch('/fsos/:id/move', (req, res, next) => {
    req.fs.move_object(req.params.id, req.body.new_parent_id)
        .then(moved => res.json({
            moved,
            ...(moved && {
                update: {
                    id: req.params.id,
                    parent_id: req.body.new_parent_id
                }
            })
        }))
        .catch(next);
});

fsRouter.patch('/fsos/:id/rename', (req, res, next) => {
    req.fs.rename_object(req.params.id, req.body.new_name)
        .then(renamed => res.json({
            renamed,
            ...(renamed && {
                update: {
                    id: req.params.id,
                    name: req.body.new_name
                }
            })
        }))
        .catch(next);
});

fsRouter.delete('/fsos/:id', (req, res, next) => {
    req.fs.delete_object(req.params.id)
        .then(deleted_at => res.json({
            deleted: !!deleted_at,
            ...(!!deleted_at && {
                update: {
                    id: req.params.id,
                    deleted_at
                }
            })
        }))
        .catch(next);
});

fsRouter.get('/folders/:id', (req, res, next) => {
    req.fs.folder_content(req.params.id)
        .then(results => res.json(results))
        .catch(next);
});

fsRouter.post('/folders/:parent_id/folders', handleNewFolder);

fsRouter.post('/folders/:parent_id/files', handleNewFile);

fsRouter.get('/files/:id/download', (req, res, next) => {
    req.fs.file(req.params.id)
        .then(file => {
            res.download(
                path.join(FS_DIR, file.url),
                file.name,
                (err) => { if (err) next(err) }
            );
        })
        .catch(next)
})

module.exports = dbSelectionRouter;

// RESOURCE CLEANING

const schedule = require('node-schedule');

const resource_cleaning_job = schedule.scheduleJob("*/20 * * * * *", async () => {
    try {
        let urls_to_delete = [
            ...(await mysql_fs_service.recently_deleted_resources()),
            ...(await mongo_fs_service.recently_deleted_resources())
        ]
        urls_to_delete.forEach(url => fs.rm(path.join(FS_DIR, url), err => err && console.error(err)));
    }
    catch (err) {
        console.error(err);
    }
})