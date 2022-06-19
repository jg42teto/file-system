use dfdb;

drop table if exists users;
create table users (
    id int auto_increment,
    email varchar(255) not null,
    password char(60) not null,
    primary key(id),
    unique key(email)
) engine=innodb;

drop table if exists disks;
create table disks (
    id int auto_increment,
    user_id int not null,
    name varchar(63),
    primary key(id)
) engine=innodb;

drop table if exists fsos;
create table fsos (
    id int auto_increment,
    disk_id int not null,
    parent_id int,
    kind char(4),
    name varchar(127),
    size bigint not null default 0,
    create_dt datetime not null default now(),
    delete_dt datetime default null,
    primary key(id)
) engine=innodb;

drop table if exists files;
create table files (
    id int,
    url varchar(255) not null,
    primary key(id),
    unique key(url)
) engine=innodb;

drop table if exists folders;
create table folders (
    id int,
    children_files_number int not null default 0,
    total_files_number int not null default 0,
    primary key(id)
) engine=innodb;

drop table if exists deleted_resources;
create table deleted_resources (
    id int auto_increment,
    url varchar(255) not null,
    primary key(id)
) engine=innodb;

alter table disks add constraint fk_disks_user_id
    foreign key(user_id) references users(id)
        on update cascade
        on delete restrict;

alter table fsos add constraint fk_fsos_disk_id
    foreign key(disk_id) references disks(id)
        on update cascade
        on delete no action;

alter table fsos add constraint fk_fsos_parent_id
    foreign key(parent_id) references folders(id)
        on update cascade
        on delete no action;

alter table files add constraint fk_files_fsos_id
    foreign key(id) references fsos(id)
        on update cascade
        on delete no action;

alter table folders add constraint fk_folders_fsos_id
    foreign key(id) references fsos(id)
        on update cascade
        on delete no action;

