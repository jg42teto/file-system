## Table of contents:
  - [About](#about)
  - [How to run](#how-to-run)
  - [Seeding dummy data](#seeding-dummy-data)
  - [Scripts with MySQL and MongoDB queries](#scripts-with-mysql-and-mongodb-queries)
  - [Docker images' tags](#docker-images-tags)
  - [Functionalities](#functionalities)

## About

This project represents a simple online drive. It is simply named **FileSystem**. Its focus is on writing database scripts for MySQL and MongoDB. Main technologies are Express 4, Angular 13, MongoDB 5 and MySQL 8.

## How to run

**Docker** should be used for running this app. The `docker-compose up` command should be run in the root directory of the project. MongoDB server, MySQL server, frontend server and backend server will be available respectively on ports **11111**, **11112**, **11113** and **11114** on the host machine. In case of a conflict change the `ports` property for the appropriate service in the `./docker-compose.yml` file.

## Seeding dummy data

After the system is up and running, there will be no dummy users. A new user can be easily registered but  there is a convenient possibility to seed a default user and some dummy files. By executing script `./seeds/seed.sh`, a user with credentials **john@example.com** (e-mail) and **john** (password) will be created. Each subsequent run of the script will have the same outcome as if the script is run against the empty database.

## Scripts with MySQL and MongoDB queries

The scripts could be found on the following paths:
 - ./dbs/mysql/* - all mysql queries
 - ./server/services/mongo_fs_service.js - all MongoDB queries
It should be emphasized that basically all core logic is implemented through db queries.

## Docker images' tags

The system should work for all recent versions of the used images. In order to avoid pulling the exact versions and to use existing ones, the tags of the images in the `./docker-compose.yml` and `./client/Dockerfile` files are omitted. Anyway, the system is developed with the following precise versions of the images:
 - node:17.3.1-alpine3.15
 - mongo:5.0.5-focal
 - mysql:8.0.27

## Functionalities

Basic file system management is supported. One iteresting functionality is that files and directories could be soft deleted. After removal, for about a minute, an object could be found in the *Trashed* section from where it could be recovered. Another one is that when a new disk is created, one can choose wheather to use MySQL or MongoDB database for managing that disk.
