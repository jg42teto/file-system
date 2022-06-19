use dfdb;

drop event if exists permanent_deletion;
delimiter $$
create event permanent_deletion
on schedule
    every 40 second
on completion preserve
enable
do begin
    declare _id int;
    declare _loop boolean;
    declare _cur cursor for
        select id
        from fsos
        where delete_dt < date_sub(now(), interval 40 second);
    declare continue handler for not found
        set _loop = false;
    
    open _cur;
    set _loop = true;
    __loop: loop
        fetch _cur into _id;
        if not _loop then
            leave __loop;
        end if;
        
        call fso_delete(_id);

    end loop;
    close _cur;
end $$
delimiter ;

