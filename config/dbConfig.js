const mysql = require('mysql');

// Function to create a new MySQL connection
function createConnection() {
  return mysql.createConnection({
    // user: 'root',
    // host: 'localhost',
    // password: '',
    // database: 'hrm_m',
    // port: 3306,
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    multipleStatements:true
  });
}


// Function to execute a query against the MySQL database
async function executeQuery(query, params) {
  let connection = createConnection();

  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        connection.end(); 
        return reject(err); 
      }

      // Execute the query
      connection.query(query, params, (err, results) => {
        connection.end(); 

        if (err) {
          return reject(err); 
        }

        resolve(results); 
      });
    });
  });
}


module.exports = {
  executeQuery,
};