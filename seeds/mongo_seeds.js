db = db.getSiblingDB('dfdb')

let disk_id;

db.disks.drop();
db.disks.insertOne({
    _id: (disk_id = ObjectId()),
    user_id: 1,
    name: "mongo-1"
});

let parent_id;

db.fsos.drop();
db.fsos.insertMany([
    {
        disk_id,
        name: "1.txt",
        kind: "file",
        size: 10,
        url: "mongo1.txt"
    },
    {
        disk_id,
        name: "2.txt",
        kind: "file",
        size: 10,
        url: "mongo2.txt"
    },
    {
        _id: (parent_id = ObjectId()),
        disk_id,
        name: "a",
        kind: "fold",
        size: 60,
        children_files_number: 2,
        total_files_number: 6,
    },
    {
        disk_id,
        parent_id,
        name: "3.txt",
        kind: "file",
        size: 10,
        url: "mongo3.txt",
    },
    {
        disk_id,
        parent_id,
        name: "4.txt",
        kind: "file",
        size: 10,
        url: "mongo4.txt"
    },
    {
        disk_id,
        parent_id,
        _id: (parent_id = ObjectId()),
        name: "b",
        kind: "fold",
        size: 40,
        children_files_number: 4,
        total_files_number: 4,
    },
    {
        disk_id,
        parent_id,
        name: "5.txt",
        kind: "file",
        size: 10,
        url: "mongo5.txt"
    },
    {
        disk_id,
        parent_id,
        name: "6.txt",
        kind: "file",
        size: 10,
        url: "mongo6.txt"
    },
    {
        disk_id,
        parent_id,
        name: "7.txt",
        kind: "file",
        size: 10,
        url: "mongo7.txt"
    },
    {
        disk_id,
        parent_id,
        name: "8.txt",
        kind: "file",
        size: 10,
        url: "mongo8.txt"
    },
])

db.deleted_resources.drop();
