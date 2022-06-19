const { query } = require('#root/dbs/mongo')
const { ObjectId } = require("mongodb")
const schedule = require('node-schedule');

const disk_proj_stages = [
    {
        $set: {
            id: "$_id",
            create_dt: { $toDate: "$_id" }
        }
    },
    { $unset: ["_id"] }
];
const fso_proj_stages = disk_proj_stages;

const fso_fetch = (db, id) => {
    return db.collection('fsos').find({ _id: ObjectId(id) }).next();
}
const fso_grouping = (db, match_stage) => {
    return db.collection('fsos').aggregate([
        {
            $match: match_stage
        },
        ...fso_proj_stages,
        {
            $group: {
                _id: "$kind",
                group: {
                    $push: "$$ROOT"
                }
            }
        },
        {
            $replaceWith: {
                k: { $cond: [{ $eq: ["$_id", "fold"] }, "folders", "files"] },
                v: "$group"
            }
        },
        {
            $group: {
                _id: null,
                groups: {
                    $push: "$$ROOT"
                }
            }
        },
        {
            $replaceWith: { $arrayToObject: "$groups" }
        },
        {
            $set: {
                "files": { $cond: ["$files", "$files", []] },
                "folders": { $cond: ["$folders", "$folders", []] }
            }
        }
    ]).next()
        .then(result => result || { folders: [], files: [] })
}
const fso_upward_update = async (db, id, positive) => {
    let fso = await fso_fetch(db, id);
    let parent_id = fso?.parent_id;
    if (!parent_id) return;

    let sign = positive ? 1 : -1;

    if (fso.kind == 'file') {
        await db.collection('fsos').updateOne(
            { _id: fso.parent_id },
            { $inc: { children_files_number: sign } }
        );
    }

    let size_change = (fso.size * sign) || 0;
    let files_number_change = ((fso.kind == 'file' ? 1 : fso.total_files_number) * sign) || 0;
    if (!size_change && !files_number_change) return;

    let child_id = id;
    while (parent_id) {
        await db.collection('fsos').updateOne(
            { _id: parent_id },
            {
                $inc: {
                    size: size_change,
                    total_files_number: files_number_change,
                }
            }
        );
        child_id = parent_id;
        parent_id = (await fso_fetch(db, child_id))?.parent_id;
    }
}
const fso_deleted = async (db, id) => {
    let deleted = false;
    while (!deleted && id) {
        let fso = await fso_fetch(db, id);
        deleted = !!fso?.delete_dt;
        id = fso?.parent_id;
    }
    return deleted;
}
const new_fso = async (db, disk_id, parent_id, data) => {
    if (!disk_id) {
        disk_id = (await db.collection('fsos')
            .find(
                { _id: ObjectId(parent_id) },
                { _id: 0, disk_id: 1 }
            ).next()).disk_id
    }
    else {
        disk_id = ObjectId(disk_id)
    }
    let { insertedId } = await db.collection('fsos')
        .insertOne({
            disk_id,
            ...(parent_id && { parent_id: ObjectId(parent_id) }),
            ...data
        });
    if (data.kind == "file")
        fso_upward_update(db, insertedId, true);
    return db.collection('fsos').aggregate([
        { $match: { _id: insertedId } },
        ...fso_proj_stages
    ]).next();
}
const delete_fso_group = (group) => {
    const { files, folders } = group;
    if (files.length > 0) {
        query().then(db => db.collection('deleted_resources').insertMany(
            files.map(({ url }) => ({ url }))
        )); // no waiting required
    }
    let ids_to_delete = [...files, ...folders].map(x => x.id);
    if (ids_to_delete.length > 0) {
        ids_to_delete = ids_to_delete.filter((v, i, a) => a.indexOf(v) === i) // unique
        query().then(db => db.collection('fsos').deleteMany(
            { _id: { $in: ids_to_delete.map(id => ObjectId(id)) } }
        )); // no waiting required
    }
}

const DELETION_INTERVAL_SECONDS = 40;

const prepare_for_deletion_helper = async (db, $match) => {
    const { files, folders } = await query().then(db => fso_grouping(db, $match));

    for (const f of folders.slice(0)) {
        children = await prepare_for_deletion_helper(db, { parent_id: ObjectId(f.id) });
        folders.push(...children.folders);
        files.push(...children.files);
    }

    return { files, folders };
}

const prepare_for_deletion = (db) => {
    return prepare_for_deletion_helper(db, {
        delete_dt: {
            $exists: 1,
        },
        $expr: {
            $lt: [
                "$delete_dt",
                {
                    $dateSubtract: {
                        startDate: "$$NOW",
                        unit: "second",
                        amount: DELETION_INTERVAL_SECONDS,
                    }
                }
            ]
        }
    });
}

const permanent_deletion_job = schedule.scheduleJob(`*/${DELETION_INTERVAL_SECONDS} * * * * *`, async () => {
    try {
        query()
            .then(prepare_for_deletion)
            .then(delete_fso_group)
    }
    catch (err) {
        console.error(err);
    }
});

module.exports = {
    new_disk(user_id, name) {
        return query()
            .then(async (db) => {
                let { insertedId } = await db.collection('disks').insertOne({ user_id, name });
                return db.collection('disks').aggregate([
                    { $match: { _id: insertedId } },
                    ...disk_proj_stages
                ]).next();
            })
    },
    disks(user_id) {
        return query()
            .then(db => db.collection('disks').aggregate([
                { $match: { user_id } },
                ...disk_proj_stages
            ]).toArray())
    },
    disk(id) {
        return query()
            .then(db => db.collection('disks').aggregate([
                { $match: { _id: ObjectId(id) } },
                ...disk_proj_stages
            ]).toArray())
            .then(result => result[0] || null)
    },
    rename_disk(id, new_name) {
        return query()
            .then(db => db.collection('disks').updateOne({ _id: ObjectId(id) }, { $set: { name: new_name } }))
            .then(({ modifiedCount }) => !!modifiedCount)
    },
    delete_disk(id) {
        return query()
            .then(async (db) => {
                const { deletedCount } = await db.collection('disks').deleteOne({ _id: ObjectId(id) })
                let deleted = !!deletedCount;
                if (!deleted) return false;

                const group = await fso_grouping(db, { disk_id: ObjectId(id) });
                delete_fso_group(group); // no waiting required
                return true;
            });
    },
    disk_root_content(id) {
        return query()
            .then(db => fso_grouping(db, {
                delete_dt: { $exists: 0 },
                parent_id: { $exists: 0 },
                disk_id: ObjectId(id)
            }));
    },
    deleted_content(id) {
        return query()
            .then(db => fso_grouping(db, {
                delete_dt: { $exists: 1 },
                disk_id: ObjectId(id)
            }));
    },
    folder_content(id) {
        return query()
            .then(db => fso_grouping(db, {
                delete_dt: { $exists: 0 },
                parent_id: ObjectId(id),
            }));
    },
    new_folder(disk_id, parent_id, name) {
        return query()
            .then(db => new_fso(db, disk_id, parent_id, {
                name,
                kind: "fold",
                size: 0
            }));
    },
    file(id) {
        return query()
            .then(db => fso_fetch(db, id));
    },
    new_file(disk_id, parent_id, name, size, url) {
        return query()
            .then(db => new_fso(db, disk_id, parent_id, {
                name,
                kind: "file",
                size,
                url
            }));
    },
    object_with_owner_id(id) {
        return query()
            .then(db => db.collection("fsos").aggregate([
                { $match: { _id: ObjectId(id) } },
                {
                    $lookup: {
                        from: 'disks',
                        localField: 'disk_id',
                        foreignField: '_id',
                        as: 'disks'
                    }
                },
                {
                    $set: {
                        user_id: { $arrayElemAt: ["$disks.user_id", 0] }
                    },
                },
                { $unset: ["disks"] },
                ...disk_proj_stages
            ]).toArray())
            .then(result => result[0] || null)
    },
    move_object(id, new_parent_id) {
        return query()
            .then(async (db) => {
                let child = await fso_fetch(db, id);
                let child_deleted = await fso_deleted(db, id);
                let new_parent = new_parent_id && await fso_fetch(db, new_parent_id);
                let new_parent_deleted = new_parent_id && await fso_deleted(db, new_parent_id);
                if (
                    child.parent_id == new_parent ||
                    child_deleted ||
                    new_parent_deleted ||
                    (new_parent && !new_parent.disk_id.equals(child.disk_id))
                ) {
                    return false;
                }

                await fso_upward_update(db, id, false);
                await db.collection('fsos').updateOne(
                    { _id: ObjectId(id) },
                    new_parent_id
                        ? { $set: { parent_id: ObjectId(new_parent_id) } }
                        : { $unset: { parent_id: "" } }
                );
                fso_upward_update(db, id, true);  // no waiting required
                return true;
            });
    },
    rename_object(id, new_name) {
        return query()
            .then(db => db.collection('fsos').updateOne({ _id: ObjectId(id) }, { $set: { name: new_name } }))
            .then(({ modifiedCount }) => !!modifiedCount)
    },
    delete_object(id) {
        return query()
            .then(async (db) => {
                if (await fso_deleted(db, id)) {
                    return null;
                }
                let date;
                let { modifiedCount } = await db.collection('fsos').updateOne(
                    { _id: ObjectId(id), delete_dt: { $exists: 0 } },
                    { $set: { delete_dt: (date = new Date()) } }
                );
                let deleted = !!modifiedCount;
                if (deleted) {
                    fso_upward_update(db, id, false); // no waiting required
                }
                return deleted ? date : null;
            })
    },
    recover_object(id) {
        return query()
            .then(async (db) => {
                let { modifiedCount } = await db.collection('fsos').updateOne(
                    { _id: ObjectId(id), delete_dt: { $exists: 1 } },
                    { $unset: { delete_dt: "" } }
                );
                let recovered = !!modifiedCount;
                let rooted = false;
                if (recovered && (await fso_deleted(db, id))) {
                    await db.collection('fsos').updateOne(
                        { _id: ObjectId(id) },
                        { $unset: { parent_id: "" } }
                    );
                    rooted = true;
                }
                else if (recovered) {
                    fso_upward_update(db, id, true); // no waiting required
                }
                return {
                    recovered,
                    rooted
                }
            })
    },
    recently_deleted_resources() {
        return query().then(async (db) => {
            let rs = await db.collection('deleted_resources')
                .find({}).toArray();
            db.collection('deleted_resources').deleteMany(
                { _id: { $in: rs.map(r => r._id) } }
            ); // no waiting required
            return rs.map(r => r.url);
        });
    }
}