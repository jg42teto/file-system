use dfdb;

drop function if exists fso_kind;
delimiter $$
create function fso_kind(_id int)
returns char(4)
deterministic
begin
    declare _result char(4);
    select kind
    from fsos
    where id = _id
    into _result;
    return _result;
end $$
delimiter ;

drop function if exists fso_parent_id;
delimiter $$
create function fso_parent_id(_id int)
returns int
deterministic
begin
    declare _result int;
    select parent_id
    from fsos
    where id = _id
    into _result;
    return _result;
end $$
delimiter ;

drop function if exists fso_disk_id;
delimiter $$
create function fso_disk_id(_id int)
returns int
deterministic
begin
    declare _result int;
    select disk_id
    from fsos
    where id = _id
    into _result;
    return _result;
end $$
delimiter ;

drop function if exists fso_deleted;
delimiter $$
create function fso_deleted(_id int)
returns boolean
deterministic
begin
    declare _deleted boolean;
    declare _parent_id int;

    set _deleted = false;
    while not _deleted and not isnull(_id) do
        select 
            not isnull(delete_dt),
            parent_id
        from fsos
        where id = _id
        into
            _deleted,
            _id;
    end while;
    
    return _deleted;
end $$
delimiter ;

