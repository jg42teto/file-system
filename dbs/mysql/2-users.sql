use dfdb;

drop user if exists 'user'@'%';
create user 'user'@'%' identified by 'pass';
grant all on dfdb.* to 'user'@'%';

