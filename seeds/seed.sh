#!/bin/bash

seeds_dir=$(dirname $0)
prj_root=$seeds_dir/..
docker_compose_file=$prj_root/docker-compose.yml
fs_dir=$prj_root/server/storage/fs

echo
echo "-> Seeding mongo..."

cat $seeds_dir/mongo_seeds.js | docker-compose -f $docker_compose_file exec -T mongo_db mongosh --quiet -u root -p root > /dev/null

echo
echo "-> Seeding mysql..."

cat $seeds_dir/mysql_seeds.sql | docker-compose -f $docker_compose_file exec -T mysql_db mysql -uroot -proot dfdb > /dev/null

echo
echo "-> Seeding files..."

find $fs_dir -type f ! -name '.gitignore' -execdir rm {} +
for db in mongo mysql
do
    for i in {1..8}
    do
        file=$db$i.txt
        file_path=$fs_dir/$file
        echo -n $file > "$file_path"
    done
done

echo
echo "-> Seeding completed."