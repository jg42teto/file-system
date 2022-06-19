use dfdb;


delete from fsos
order by id desc;
delete from disks;
delete from users;
delete from deleted_resources;
alter table users auto_increment = 1; 
alter table disks auto_increment = 1; 
alter table fsos auto_increment = 1; 
alter table files auto_increment = 1; 
alter table folders auto_increment = 1; 
alter table deleted_resources auto_increment = 1; 

insert into users(id, email, password) values
    (1, "john@example.com", "$2a$08$GgXuyJi1v2Kvw9HHsE7zKOC686.5Fu5u4tsLsv6rXaTOb1Tr6ajIm") -- pwd: john
;

insert into disks(id, user_id, name) values
    (1, 1, "mysql-1")
;

call file_insert(1, null, "1.txt", 10, "mysql1.txt");
call file_insert(1, null, "2.txt", 10, "mysql2.txt");
call folder_insert(1, null, "a");
call file_insert(1, 3, "3.txt", 10, "mysql3.txt");
call file_insert(1, 3, "4.txt", 10, "mysql4.txt");
call folder_insert(1, 3, "b");
call file_insert(1, 6, "5.txt", 10, "mysql5.txt");
call file_insert(1, 6, "6.txt", 10, "mysql6.txt");
call file_insert(1, 6, "7.txt", 10, "mysql7.txt");
call file_insert(1, 6, "8.txt", 10, "mysql8.txt");

