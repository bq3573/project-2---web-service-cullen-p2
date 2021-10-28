DROP DATABASE IF EXISTS project2;
DROP USER IF EXISTS cullenwaller@localhost;

CREATE DATABASE project2 CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER cullenwaller@localhost IDENTIFIED WITH mysql_native_password BY 'Daberoni1!';
GRANT ALL PRIVILEGES ON project2.* TO cullenwaller@localhost;