use dfdb;

drop trigger if exists disk_id_autofill;
delimiter $$
create trigger disk_id_autofill
before insert on fsos
for each row
begin
    declare _disk_id int;
    if isnull(new.disk_id) and not isnull(new.parent_id) then
        select disk_id
        from fsos
        where id = new.parent_id
        into _disk_id;
        set new.disk_id = _disk_id;
    end if;
end $$
delimiter ;

drop trigger if exists fso_delete_file_delete;
delimiter $$
create trigger fso_delete_file_delete
before delete on fsos
for each row
begin
    delete from files
    where id = old.id;
end $$
delimiter ;

drop trigger if exists fso_delete_folder_delete;
delimiter $$
create trigger fso_delete_folder_delete
before delete on fsos
for each row
begin
    delete from folders
    where id = old.id;
end $$
delimiter ;

drop trigger if exists disk_delete_fso_delete;
delimiter $$
create trigger disk_delete_fso_delete
before delete on disks
for each row
begin
    delete from fsos
    where disk_id = old.id
    order by id desc;
end $$
delimiter ;

drop trigger if exists blacklist_url;
delimiter $$
create trigger blacklist_url
after delete on files
for each row
begin
    insert into deleted_resources(url)
    values (old.url);
end $$
delimiter ;

