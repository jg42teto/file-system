const mysql = require('#root/dbs/mysql');

function procedure(proc, ...params) {
    q = 'call ' + proc + '(';
    switch (params.length) {
        case 0:
            break;
        case 1:
            q += '?';
            break;
        default:
            q += '?' + ',?'.repeat(params.length - 1);
    }
    q += ')';
    return mysql.query(q, params);
}

module.exports = {
    new_disk(user_id, name) {
        return procedure("disk_insert", user_id, name)
            .then(result => result[0][0].id && result[0][0])
    },
    disks(user_id) {
        return procedure("disks_select", user_id)
            .then(result => result[0]);
    },
    disk(id) {
        return procedure("disk_select", id)
            .then(result => result[0][0] || null);
    },
    rename_disk(id, new_name) {
        return procedure("disk_rename", id, new_name)
            .then(result => !!result[0][0].renamed)
    },
    delete_disk(id) {
        return procedure("disk_delete", id)
            .then(result => result[0][0].deleted);
    },
    disk_root_content(id) {
        return procedure("disk_ls", id)
            .then(result => ({ folders: result[0], files: result[1] }));
    },
    deleted_content(id) {
        return procedure("disk_deleted_ls", id)
            .then(result => ({ folders: result[0], files: result[1] }));
    },
    folder_content(id) {
        return procedure("folder_ls", id)
            .then(result => ({ folders: result[0], files: result[1] }));
    },
    new_folder(disk_id, parent_id, name) {
        return procedure("folder_insert", disk_id, parent_id, name)
            .then(result => result[0][0].id && result[0][0])
    },
    file(id) {
        return procedure("file_select", id)
            .then(result => result[0][0]);
    },
    new_file(disk_id, parent_id, name, size, url) {
        return procedure("file_insert", disk_id, parent_id, name, size, url)
            .then(result => result[0][0].id && result[0][0])
    },
    object_with_owner_id(id) {
        return procedure("fso_with_user_id_select", id)
            .then(result => result[0][0] || null);
    },
    move_object(id, new_parent_id) {
        return procedure("fso_move", id, new_parent_id)
            .then(result => !!result[0][0].moved)
    },
    rename_object(id, new_name) {
        return procedure("fso_rename", id, new_name)
            .then(result => !!result[0][0].renamed)
    },
    delete_object(id) {
        return procedure("fso_soft_delete", id)
            .then(result => result[0][0].delete_dt);
    },
    recover_object(id) {
        return procedure("fso_delete_recover", id)
            .then(result => ({
                recovered: !!result[0][0].recovered,
                rooted: !!result[0][0].rooted
            }));
    },
    recently_deleted_resources() {
        return procedure("deleted_resources_select_delete")
            .then(result => result[0].map(r => r.url));
    }
}