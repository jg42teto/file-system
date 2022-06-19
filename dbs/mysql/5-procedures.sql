use dfdb;

drop procedure if exists fso_upward_update;
delimiter $$
create procedure fso_upward_update(in _id int, in _additive boolean)
__procedure: begin
    declare _child_id int;
    declare _size, _files_number int;
    declare _parent_id int default fso_parent_id(_id);
    declare _sign int default if(_additive, 1, -1);
    declare _direct_parent boolean default true;

    if isnull(_parent_id) then
        leave __procedure;
    end if;

    case fso_kind(_id)
        when "fold" then
            select total_files_number * _sign
            from folders
            where id = _id
            into _files_number;
        when "file" then 
            set _files_number = _sign;
            
            update folders
            set children_files_number = children_files_number + _files_number
            where id = _parent_id;
    end case;

    select size * _sign
    from fsos
    where id = _id
    into _size;
    
    set _child_id = _id;
    __loop: while _parent_id do
        update fsos
        set size = size + _size
        where id = _parent_id;

        update folders
        set total_files_number = total_files_number + _files_number
        where id = _parent_id;

        set _child_id = _parent_id;
        set _parent_id = fso_parent_id(_child_id);
    end while;
end $$
delimiter ;

drop procedure if exists fso_delete;
delimiter $$
create procedure fso_delete(in _id int)
begin
    declare _child_id int;
    declare _loop boolean;
    declare _cur cursor for
        select id 
        from fsos
        where parent_id = _id;
    declare continue handler for not found
        set _loop = false;

    if fso_kind(_id) = "fold" then
        open _cur;
        set _loop = true;
        __loop: loop
            fetch _cur into _child_id;
            if not _loop then
                leave __loop;
            end if;
            call fso_delete(_child_id);
        end loop;
        close _cur;
    end if;

    delete from fsos
    where id = _id;
end $$
delimiter ;

drop procedure if exists fso_soft_delete;
delimiter $$
create procedure fso_soft_delete(in _id int)
__procedure: begin
    declare _deleted boolean;
    
    if fso_deleted(_id) then
        select null as delete_dt;
        leave __procedure;
    end if;

    update fsos
    set delete_dt = now()
    where 
        id = _id and
        isnull(delete_dt);
    set _deleted = ROW_COUNT();
    if _deleted then
        call fso_upward_update(_id, false);
    end if;
    select if(_deleted, now(), null) as delete_dt;
end $$
delimiter ;

drop procedure if exists fso_delete_recover;
delimiter $$
create procedure fso_delete_recover(in _id int)
begin
    declare _recovered boolean;
    declare _rooted boolean default false;
    update fsos
    set delete_dt = null
    where 
        id = _id and
        not isnull(delete_dt)
    ;
    set _recovered = ROW_COUNT();
    if _recovered and fso_deleted(_id) then
        update fsos
        set parent_id = null
        where id = _id;
        set _rooted = true;
    elseif _recovered then
        call fso_upward_update(_id, true);
    end if;
    select 
        _recovered as recovered,
        _rooted as rooted;
end $$
delimiter ;

drop procedure if exists file_select;
delimiter $$
create procedure file_select(in _id int)
begin
    select *
    from fsos
    join files
    on fsos.id = files.id
    where fsos.id = _id;
end $$
delimiter ;

drop procedure if exists fso_with_user_id_select;
delimiter $$
create procedure fso_with_user_id_select(in _id int)
begin
    select fsos.*, disks.user_id
    from fsos
    join disks
    on disks.id = fsos.disk_id
    where fsos.id = _id;
end $$
delimiter ;

drop procedure if exists file_insert;
delimiter $$
create procedure file_insert(in _disk_id int, in _parent_id int, in _name varchar(127), in _size bigint, in _url varchar(255))
begin
    declare _inserted boolean;
    start transaction;
    insert into fsos(disk_id, parent_id, kind, name, size) value (_disk_id, _parent_id, "file", _name, _size);
    insert into files(id, url) value (last_insert_id(), _url);
    set _inserted = row_count();
    commit;
    if not _inserted then
        select null as id;
    else
        call fso_upward_update(last_insert_id(), true);
        call file_select(last_insert_id());
    end if;
end $$
delimiter ;

drop procedure if exists folder_insert;
delimiter $$
create procedure folder_insert(in _disk_id int, in _parent_id int, in _name varchar(127))
begin
    declare _inserted boolean;
    start transaction;
    insert ignore into fsos(disk_id, parent_id, kind, name) value (_disk_id, _parent_id, "fold", _name);
    insert ignore into folders(id) value (last_insert_id());
    set _inserted = row_count();
    commit;
    if not _inserted then
        select null as id;
    else
        select *
        from fsos
        join folders
        on folders.id = fsos.id
        where fsos.id = last_insert_id();
    end if;
end $$
delimiter ;

drop procedure if exists fso_move;
delimiter $$
create procedure fso_move(in _id int, in _new_parent_id int)
__procedure: begin
    if
        _new_parent_id = fso_parent_id(_id) or 
        fso_deleted(_id) or 
        fso_deleted(_new_parent_id) or
        (not isnull(_new_parent_id) and fso_disk_id(_id) <> fso_disk_id(_new_parent_id))
    then
        select false as moved;
        leave __procedure;
    end if;

    call fso_upward_update(_id, false);
    update fsos
    set parent_id = _new_parent_id
    where id = _id;
    call fso_upward_update(_id, true);
    select true as moved;
end $$
delimiter ;

drop procedure if exists fso_rename;
delimiter $$
create procedure fso_rename(in _id int, in _new_name varchar(127))
begin
    declare _renamed boolean;
    update fsos
    set name = _new_name
    where id = _id;
    set _renamed = row_count();
    select _renamed as renamed;
end $$
delimiter ;

drop procedure if exists folder_ls;
delimiter $$
create procedure folder_ls(in _id int)
begin
    select *
    from fsos
    join folders
    on folders.id = fsos.id
    where
        fsos.parent_id = _id and
        isnull(fsos.delete_dt);

    select *
    from fsos
    join files
    on files.id = fsos.id
    where
        fsos.parent_id = _id and
        isnull(fsos.delete_dt);
end $$
delimiter ;

drop procedure if exists disk_insert;
delimiter $$
create procedure disk_insert(in _user_id int, in _name varchar(63))
begin
    declare _inserted boolean;
    insert ignore into disks(user_id, name) value (_user_id, _name);
    set _inserted = row_count();
    if not _inserted then
        select null as id;
    else
        select *
        from disks
        where id = last_insert_id();
    end if;    
end $$
delimiter ;

drop procedure if exists disk_ls;
delimiter $$
create procedure disk_ls(in _id int)
begin
    select *
    from fsos
    join folders
    on folders.id = fsos.id
    where
        disk_id = _id and
        isnull(fsos.parent_id) and
        isnull(fsos.delete_dt);

    select *
    from fsos
    join files
    on files.id = fsos.id
    where
        disk_id = _id and
        isnull(fsos.parent_id) and
        isnull(fsos.delete_dt);
end $$
delimiter ;

drop procedure if exists disk_deleted_ls;
delimiter $$
create procedure disk_deleted_ls(in _id int)
begin
    select *
    from fsos
    join folders
    on folders.id = fsos.id
    where
        disk_id = _id and
        not isnull(fsos.delete_dt);

    select *
    from fsos
    join files
    on files.id = fsos.id
    where
        disk_id = _id and
        not isnull(fsos.delete_dt);
end $$
delimiter ;

drop procedure if exists disk_select;
delimiter $$
create procedure disk_select(in _id int)
begin
    select *
    from disks
    where id = _id;
end $$
delimiter ;

drop procedure if exists disks_select;
delimiter $$
create procedure disks_select(in _user_id int)
begin
    select *
    from disks
    where user_id = _user_id;
end $$
delimiter ;

drop procedure if exists disk_rename;
delimiter $$
create procedure disk_rename(in _id int, in _new_name varchar(63))
begin
    declare _renamed boolean;
    update ignore disks
    set name = _new_name
    where id = _id;
    set _renamed = row_count();
    select _renamed as renamed;    
end $$
delimiter ;

drop procedure if exists disk_delete;
delimiter $$
create procedure disk_delete(in _id int)
begin
    declare _deleted boolean;
    delete from disks
    where id = _id;
    set _deleted = row_count();
    select _deleted as deleted;
end $$
delimiter ;

drop procedure if exists deleted_resources_select_delete;
delimiter $$
create procedure deleted_resources_select_delete()
begin
    start transaction;
    select distinct url
    from deleted_resources;
    delete from deleted_resources;
    commit;
end $$
delimiter ;

