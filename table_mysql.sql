DROP TABLE Vinicius_users;
create table Vinicius_users(
   user_id INT NOT NULL AUTO_INCREMENT,
   username VARCHAR(50) NOT NULL,
   `password` VARCHAR(50) NOT NULL,
   is_employee BOOLEAN default false,
   PRIMARY KEY ( user_id )
);

INSERT INTO Vinicius_users SET username = 'employee_1', password = '58bfce1ddd3b21859b422f5dbd152880', is_employee = true;
INSERT INTO Vinicius_users SET username = 'employee_2', password = 'bacbdd3f38c1b40071249d69dc693bcd', is_employee = true;
