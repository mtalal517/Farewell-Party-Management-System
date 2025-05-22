CREATE DATABASE db;

use db;

CREATE TABLE Student (
    StudentID INT AUTO_INCREMENT PRIMARY KEY,
    StudentName VARCHAR(255) NOT NULL,
    Email VARCHAR(255) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('None','Dinner', 'Performance','Invitation','Budget','Decor') NOT NULL
);

-- Trigger to prevent more 
DELIMITER $$
CREATE TRIGGER CheckRoleBeforeInsert BEFORE INSERT ON Student
FOR EACH ROW
BEGIN
    IF NEW.Role IN ('Dinner', 'Performance','Invitation','Budget','Decor') THEN
        IF (SELECT COUNT(*) FROM Student WHERE Role = NEW.Role) >= 1 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Manager already assigned';
        END IF;
    END IF;
END$$
DELIMITER ;


CREATE TABLE Teacher (
  TeacherID INT AUTO_INCREMENT PRIMARY KEY,
  TeacherName VARCHAR(15),
  FamilyMembers INT,
  Password VARCHAR(255),
  Name VARCHAR(100),
  SpecialRequests VARCHAR(255),
  CheckOutTime TIME,
  CheckInTime TIME,
  AttendanceStatus VARCHAR(50)
);

CREATE TABLE Family (
  FamilyID INT AUTO_INCREMENT PRIMARY KEY,
  NumberOfMembers INT,
  TeacherID INT,
  FOREIGN KEY (TeacherID) REFERENCES Teacher(TeacherID)
);



CREATE TABLE Performance (
  PerformanceID INT AUTO_INCREMENT PRIMARY KEY,
  Type VARCHAR(50),
  Duration INT,
  SpecialRequirements VARCHAR(255),
  StudentID INT,
  Description VARCHAR(255),
  Voting INT,
  FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
);

CREATE TABLE MenuItem (
  MenuItemID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(50),
  Description VARCHAR(255),
  Category VARCHAR(50),
  Votes INT,
  Price DECIMAL(10, 2) NOT NULL,
  Status VARCHAR(50)
);

CREATE TABLE Budget (
  BudgetID INT AUTO_INCREMENT PRIMARY KEY,
  Category VARCHAR(50),
  Amount DECIMAL(10,2),
  AmountAllocated DECIMAL(10,2),
  RemainingAmount DECIMAL(10,2),
  AmountSpent DECIMAL(10,2),
  EventDate DATE NOT NULL 
);

INSERT INTO Budget (AmountAllocated, EventDate) VALUES (500.00, '2024-12-31');

DELIMITER $$

CREATE TRIGGER UpdateSpendingAfterInsert
AFTER INSERT ON MenuItem
FOR EACH ROW
BEGIN
    UPDATE Budget SET AmountSpent = (SELECT SUM(Price) FROM MenuItem) WHERE BudgetID = 1; -- Assuming single budget entry
END$$

CREATE TRIGGER UpdateSpendingAfterUpdate
AFTER UPDATE ON MenuItem
FOR EACH ROW
BEGIN
    UPDATE Budget SET AmountSpent = (SELECT SUM(Price) FROM MenuItem) WHERE BudgetID = 1; -- Assuming single budget entry
END$$

CREATE TRIGGER UpdateSpendingAfterDelete
AFTER DELETE ON MenuItem
FOR EACH ROW
BEGIN
    UPDATE Budget SET AmountSpent = (SELECT SUM(Price) FROM MenuItem) WHERE BudgetID = 1; -- Assuming single budget entry
END$$

DELIMITER ;
-- Example trigger after inserting a new menu item
DELIMITER $$

CREATE TRIGGER AfterMenuItemInsert
AFTER INSERT ON MenuItem
FOR EACH ROW
BEGIN
    UPDATE Budget
    SET AmountSpent = AmountSpent + NEW.Price
    WHERE BudgetID = 1; -- Assuming single budget entry
END$$

DELIMITER ;



CREATE TABLE Attendance (
  AttendanceID INT AUTO_INCREMENT PRIMARY KEY,
  Timestamp DATETIME,
  Status VARCHAR(50),
  ParticipantStudentID  INT,
  ParticipantTeacherID   INT,
  ParticipantFamilyID   INT,
  EventType VARCHAR(50),
  CheckInTime TIME,
  CheckOutTime TIME,
  FOREIGN KEY (ParticipantStudentID) REFERENCES Student(StudentID),
  FOREIGN KEY (ParticipantTeacherID) REFERENCES Teacher(TeacherID),
  FOREIGN KEY (ParticipantFamilyID) REFERENCES Family(FamilyID)
);

CREATE TABLE Task (
  TaskID INT AUTO_INCREMENT PRIMARY KEY,
  Description VARCHAR(255),
  Deadline DATE,
  Status VARCHAR(50),
  AssignedToStudent  INT,
  AssignedToTeacher  INT,
  AssignedToFamily INT,
  FOREIGN KEY (AssignedToStudent) REFERENCES Student(StudentID),
  FOREIGN KEY (AssignedToFamily) REFERENCES Family(FamilyID),
  FOREIGN KEY (AssignedToTeacher) REFERENCES Teacher(TeacherID)
);

CREATE TABLE Announcements (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  Message TEXT NOT NULL,
  Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Menu Proposals
CREATE TABLE MenuProposal (
  ProposalID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(50),
  Description VARCHAR(255),
  Category VARCHAR(50),
  StudentID INT,
  FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
);

-- Table for Performance Proposals
CREATE TABLE PerformanceProposal (
  ProposalID INT AUTO_INCREMENT PRIMARY KEY,
  Type VARCHAR(50),
  Duration INT,
  SpecialRequirements VARCHAR(255),
  StudentID INT,
  Description VARCHAR(255),
  FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
);




CREATE TABLE Invitations (
    InvitationID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255),
    Message TEXT,
    Method ENUM('email', 'print', 'other'),
    Recipients TEXT,
    Status ENUM('pending', 'sent') DEFAULT 'Sent',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TeacherID INT,
    FOREIGN KEY (TeacherID) REFERENCES Teacher(TeacherID)
);

-- Insert quries
INSERT INTO Student (StudentName, Email, Password, Role) VALUES
('Talal', 'john.doe@example.com', '123', 'None'),
('Huzi', 'jane.smith@example.com', '123', 'Dinner'),
('Haroon', 'jane.smith@example.com', '123', 'Budget');

INSERT INTO Performance (Type, Duration, SpecialRequirements, StudentID, Description, Voting) VALUES
('Music', 120, 'Grand piano required', 1, 'Solo piano performance', 5),
('Dance', 90, 'Open space required', 2, 'Contemporary dance performance', 4),
('Theater', 150, 'Stage with multiple props', 3, 'Shakespearean play', 3);


INSERT INTO Budget (Amount, AmountAllocated, RemainingAmount, AmountSpent, EventDate, Category)
VALUES 
(10000.00, 3000.00, 7000.00, 0.00, '2024-06-01', 'Venue'),
(10000.00, 2000.00, 8000.00, 0.00, '2024-06-01', 'Catering'),
(10000.00, 1500.00, 8500.00, 0.00, '2024-06-01', 'Decorations'),
(10000.00, 500.00, 9500.00, 0.00, '2024-06-01', 'Entertainment'),
(10000.00, 500.00, 9500.00, 0.00, '2024-06-01', 'Menu');

INSERT INTO Announcements (Message) VALUES
('Remember to submit your performance forms by next Friday!');

INSERT INTO Teacher (TeacherName, FamilyMembers, Password, Name, SpecialRequests, CheckOutTime, CheckInTime, AttendanceStatus)
VALUES ('John Doe', 3, 'securePassword123', 'Johnathan Doe', 'Needs a projector', '17:00:00', '08:00:00', 'Present');

INSERT INTO Invitations (Title, Message, Method, Recipients, TeacherID) VALUES
('Annual Day Invitation', 'You are cordially invited to our Annual Day Celebration.', 'email', 'Parents of Class 10', 1);

-- Insert into Task
INSERT INTO Task (Description, Deadline, Status, AssignedToStudent) VALUES
('Decorate the hall', '2024-05-20', 'Pending', 1);




