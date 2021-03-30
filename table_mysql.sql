DROP TABLE Vinicius_users;
create table Vinicius_users(
   user_id INT NOT NULL AUTO_INCREMENT,
   username VARCHAR(50) NOT NULL,
   `password` VARCHAR(50) NOT NULL,
   is_employee BOOLEAN default false,
   PRIMARY KEY ( user_id )
);

INSERT INTO Vinicius_users SET username = 'employee_1', password = 'employee_1', is_employee = true;
INSERT INTO Vinicius_users SET username = 'employee_2', password = 'employee_2', is_employee = true;
