CREATE DATABASE myFoodshop;
USE myFoodshop;
CREATE TABLE shop (foodID INT AUTO_INCREMENT,name VARCHAR(50),values_per VARCHAR(50),unit_value VARCHAR(50),carbs DECIMAL(5, 2), fat DECIMAL(5, 2),protein DECIMAL(5, 2), salt DECIMAL(5, 2),sugar DECIMAL(5, 2) unsigned,PRIMARY KEY(foodID));
CREATE USER 'a'@'localhost' IDENTIFIED WITH mysql_native_password BY 'a';
GRANT ALL PRIVILEGES ON myFoodshop.* TO 'a'@'localhost';

SELECT * from shop;

CREATE TABLE userdata (userID INT AUTO_INCREMENT PRIMARY KEY,username VARCHAR(50), firstname VARCHAR(50), lastname VARCHAR(50),email VARCHAR(255) NOT NULL UNIQUE,hashedPassword VARCHAR(255) UNIQUE);
INSERT INTO userdata (username, firstname,lastname,email,hashedPassword)VALUES('james007',"James","Bond","james007@gmail.com","*%$&23cf£^13!&!*" );
