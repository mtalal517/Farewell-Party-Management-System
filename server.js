const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'db'
});

connection.connect(err => {
  if (err) throw err;
  console.log('Connected to the MySQL server.');
});

// Register A Student
app.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  const sql = `INSERT INTO Student (StudentName, Email, Password, Role) VALUES (?, ?, ?, ?)`;
  connection.query(sql, [username, email, password, role], (err, results) => {
    if (err) {
      if (err.code === 'ER_SIGNAL_EXCEPTION') {
        res.status(400).send(err.sqlMessage);
      } else {
        res.status(500).send('Registration failed');
      }
      return;
    }
    res.send('Registration successful');
  });
});


// Login Student
app.post('/login', (req, res) => {
  const { StudentId, password, role } = req.body;
  const sql = 'SELECT Password, Role FROM Student WHERE StudentID = ?';
  connection.query(sql, [StudentId], (err, results) => {
    if (err) {
      res.status(500).send('Error during login');
      throw err;
    }
    if (results.length > 0) {
      if (password === results[0].Password && role === results[0].Role) {
        // Based on the role, serve different dashboards
        let dashboardPath = '/views/STUDENT.html'; // default to student dashboard
        if (role === 'Dinner') 
        {
          dashboardPath = '/views/dinner_dashboard.html';
        } 
        else if (role === 'Performance') 
        {
          dashboardPath = '/views/performance_dashboard.html';
        }
        else if (role === 'Invitation') 
        {
          dashboardPath = '/views/invitation_dashboard.html';
        }
        else if (role === 'Budget') 
        {
          dashboardPath = '/views/budget_dashboard.html';
        }
        else if (role === 'Decor') 
        {
          dashboardPath = '/views/decor_dashboard.html';
        }
        else if (role === 'None') 
        {
          dashboardPath = '/views/STUDENT.html';
        }
        res.sendFile(dashboardPath, { root: __dirname });
      } else 
      {
        res.send('Login failed');
      }
    } else {
      res.send('User not found');
    }
  });
});
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


                                                                              // STUDENT MENU


// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Insert menu suggestion into the database
app.post('/submit_menu', (req, res) => {
  const { studentId, menuItem, description, category } = req.body;
  const sql = `INSERT INTO MenuProposal (StudentID, Name, Description, Category) VALUES (?, ?, ?, ?)`;
  connection.query(sql, [studentId, menuItem, description, category], (err, results) => {
    if (err) {
      res.status(500).send('Failed to submit menu suggestion');
      throw err;
    }
    res.send('Menu suggestion submitted successfully');
  });
});

app.get('/announcements', (req, res) => {
  const sql = 'SELECT * FROM Announcements ORDER BY Date DESC';
  connection.query(sql, (err, results) => {
    if (err) {
      res.status(500).send('Failed to fetch announcements');
      return;
    }
    res.json(results);
  });
});

// Get tasks assigned to the student
app.get('/tasks', (req, res) => {
  const { studentId } = req.query;
  const sql = 'SELECT * FROM Tasks WHERE AssignedToStudent = ?';
  connection.query(sql, [studentId], (err, results) => {
    if (err) {
      res.status(500).send('Failed to fetch tasks');
      return;
    }
    res.json(results);
  });
});

// Insert performance proposal into the database
app.post('/submit_proposal', (req, res) => {
  const { studentId, performanceType, duration, specialRequirements, description, voting } = req.body;
  const sql = `INSERT INTO PerformanceProposal (StudentID,Type, Duration, SpecialRequirements, Description) VALUES (?, ?, ?, ?, ?)`;
  connection.query(sql, [studentId, performanceType, duration, specialRequirements, description, voting], (err, results) => {
    if (err) {
      res.status(500).send('Failed to submit performance proposal');
      throw err;
    }
    res.send('Performance proposal submitted successfully');
  });
});
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


                                                                      // MANAGER MENU


// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Assume there's a constant or a separate entry in the database for budget
const totalBudget = 500; // Example budget limit

// Fetch budget and current spending
app.get('/budget', (req, res) => {
  const sql = 'SELECT SUM(Price) AS CurrentSpending FROM MenuItem';
  connection.query(sql, (err, results) => {
    if (err) {
      res.status(500).send('Failed to fetch current spending');
      return;
    }
    const currentSpending = results[0].CurrentSpending || 0;
    res.json({ totalBudget, currentSpending });
  });
});

// Fetch current menu items
app.get('/menu_items', (req, res) => {
  const sql = 'SELECT * FROM MenuItem';
  connection.query(sql, (err, results) => {
    if (err) {
      res.status(500).send('Failed to fetch menu items');
      return;
    }
    res.json(results);
  });
});


// Add new menu item with budget check
app.post('/add_menu_item', (req, res) => {
  const { name, description, price } = req.body;
  const sqlCheckBudget = 'SELECT SUM(Price) AS CurrentSpending FROM MenuItem';
  connection.query(sqlCheckBudget, (err, results) => {
    if (err) {
      res.status(500).send('Failed to check budget');
      return;
    }
    const currentSpending = results[0].CurrentSpending || 0;
    if (currentSpending + Number(price) > totalBudget) {
      res.status(400).send('Adding this item would exceed your budget');
      return;
    }
    const sqlInsert = 'INSERT INTO MenuItem (Name, Description, Price) VALUES (?, ?, ?)';
    connection.query(sqlInsert, [name, description, price], (insertErr) => {
      if (insertErr) {
        res.status(500).send('Failed to add menu item');
        return;
      }
      res.send('Menu item added successfully');
    });
  });
});

// Remove or modify menu item
app.put('/modify_menu_item', (req, res) => {
  const { id, newName: name, newDescription: description, newPrice: price } = req.body;
  const sql = 'UPDATE MenuItem SET Name = ?, Description = ?, Price = ? WHERE MenuItemID = ?';
  connection.query(sql, [name, description, price, id], (err) => {
    if (err) {
      res.status(500).send('Failed to update menu item');
      return;
    }
    res.send('Menu item updated successfully');
  });
});


// Delete menu item
app.delete('/delete_menu_item', (req, res) => {
  const { id } = req.query;
  console.log('Attempting to delete MenuItem with ID:', id);
  const sql = 'DELETE FROM MenuItem WHERE MenuItemID = ?';
  connection.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting menu item:', err);
      res.status(500).send('Failed to delete menu item');
      return;
    }
    if (result.affectedRows == 0) {
      res.status(404).send('Menu item not found');
    } else {
      res.send('Menu item deleted successfully');
    }
  });
});
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


                                                                    // INVITATAION MANAGER


// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Endpoint to get teacher details by name
app.get('/get_teacher_by_name', (req, res) => {
  const { name } = req.query;
  const sql = 'SELECT * FROM Teachers WHERE TeacherName = ?';
  console.log('Fetching teacher details for:', name);
  connection.query(sql, [name], (err, results) => {
    if (err) {
      res.status(500).send('Failed to fetch teacher details');
      return;
    }
    res.json(results);
  });
});

// Endpoint to send an invitation to a teacher
app.post('/send_invitation_to_teacher', (req, res) => {
  console.log('Received request:', req.body);
  const { title, message, teacherId, method = 'email' } = req.body; // Default method as email
  const sql = 'INSERT INTO Invitations (Title, Message, TeacherID, Method) VALUES (?, ?, ?, ?)';
  connection.query(sql, [title, message, teacherId, method], (err, result) => {
    if (err) {
      res.status(500).send('Failed to send invitation');
      return;
    }
    res.send('Invitation sent successfully');
  });
});
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


                                                                    // BUDGET MANAGER

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
app.get('/budget-overview', (req, res) => {
  const { eventDate } = req.query;
  const sql = 'SELECT Category, AmountAllocated FROM Budget WHERE EventDate = ?';
  connection.query(sql, [eventDate], (err, results) => {
      if (err) {
          res.status(500).send('Failed to fetch budget overview');
          return;
      }
      res.json(results);
  });
});

app.post('/record-expense', (req, res) => {
  const { category, amount, eventDate } = req.body;
  const sqlUpdate = 'UPDATE Budget SET AmountAllocated = AmountAllocated - ? WHERE Category = ? AND EventDate = ?';
  connection.query(sqlUpdate, [amount, category, eventDate], (err, result) => {
      if (err) {
          res.status(500).send('Failed to record expense');
          return;
      }
      if (result.affectedRows === 0) {
          res.status(404).send('Category or Event Date not found');
          return;
      }
      res.send('Expense recorded successfully');
  });
});

app.get('/fetch-budget-summary', (req, res) => {
  const sql = 'SELECT Category, SUM(AmountAllocated) AS Amount FROM Budget GROUP BY Category';
  connection.query(sql, (err, results) => {
      if (err) {
          res.status(500).send('Failed to fetch budget summary');
          return;
      }
      res.json(results);
  });
});

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

                                                      // Performance Manager
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- 

app.get('/performance-overview', (req, res) => {
  const sql = 'SELECT * FROM Performance';
  connection.query(sql, (err, results) => {
      if (err) {
          res.status(500).send('Failed to fetch performance overview');
          return;
      }
      res.json(results);
  });
});

// Modify performance details
app.put('/modify_performance', (req, res) => {
  const { id, newType: type, newDuration: duration, newRequirements: requirements, newStudentID: studentID, newDescription: description, newVoting: voting } = req.body;
  const sql = 'UPDATE Performance SET Type = ?, Duration = ?, SpecialRequirements = ?, StudentID = ?, Description = ?, Voting = ? WHERE PerformanceID = ?';
  connection.query(sql, [type, duration, requirements, studentID, description, voting, id], (err) => {
    if (err) {
      res.status(500).send('Failed to update performance');
      return;
    }
    res.send('Performance updated successfully');
  });
});

// API endpoint to get performance proposals
app.get('/performance-overview', (req, res) => {
  db.query('SELECT * FROM PerformanceProposal', (err, results) => {
    if (err) {
      res.status(500).send('Failed to retrieve performances from database');
    } else {
      res.json(results);
    }
  });
});









app.get('/', (req, res) => {
    res.sendFile('/views/LoginRegister.html', { root: __dirname });
  });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
    
