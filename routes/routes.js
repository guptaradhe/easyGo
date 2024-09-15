const express = require('express')
const authRoutes = require('./authRoutes')
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middlewares/authMiddleware')
let date = require('../utilities/helper')
date.currentDateTime()
const router = express.Router()

const botMsgController = require('../controllers/botMsgController');
const userController = require('../controllers/userControllers');
const { executeQuery } = require('../config/dbConfig');


router.get('/api/getBotData', authMiddleware, userController.getBotData)
router.get('/api/getMessages', userController.getMessages)

router.post('/api/bots', authMiddleware, userController.save_botname)
router.post('/api/saveWelcomeMessage', userController.saveWelcomeMessage)



router.post('/api/updateMessageStatus', userController.updateMessageStatus)

// router.post('/api/upload-excel-file',userController.updateMessageStatus)

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {


    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });



const storage1 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'botUploads/');
  },
  filename: (req, file, cb) => {
    var random = Date.now() + '-' + Math.round(Math.random() * 1E9)

    cb(null, random + '-' + file.originalname);
  }
});

const upload1 = multer({ storage: storage1 });



router.post('/upload', upload.single('questions'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }


  // Path to the uploaded file
  const filePath = path.join('./uploads', req.file.filename);
  console.log(filePath, ".....................................");
  try {
    // Read and parse the uploaded Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Read the first sheet
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet); // Convert to JSON array

    if (data.length === 0) {
      return res.status(400).send('No data found in the file.');
    }
    console.log(data, "....................//////////////");


    // Prepare data for insertion
    const values = [];
    data.forEach(row => {
      console.log(row.QText);
      // Assuming row contains the values for the columns in q_master
      values.push([
        row.admin,
        row.user_id,
        row.mobile_number,
        row.bot_id,
        row.bot_name,
        row.question,
        row.created_date,
        row.created_time,
        row.status
      ]);
    });

    // Execute the query with the collected values
    // const query = 'INSERT INTO q_master (admin, user_id, mobile_number, bot_id, bot_name, question, created_date, created_time, status) VALUES ?';

    // // Assuming you have a MySQL connection object `connection`
    // connection.query(query, [values], (error, results) => {
    //     if (error) throw error;
    //     console.log('Rows inserted:', results.affectedRows);
    // });

    // const values=[]
    //     // Insert data into MySQL
    //     db.query(query, [values], (err, results) => {
    //       if (err) {
    //         console.error('Error inserting data into MySQL:', err);
    //         return res.status(500).send('Internal Server Error');
    //       }

    //       console.log('Data inserted successfully:', results);
    //       res.status(200).send('File data uploaded and saved to database.');
    //     });

  } catch (error) {
    console.error('Error processing the file:', error);
    res.status(500).send('Error processing the file.');
  } finally {
    // Clean up uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
  }
});




router.post('/add-node', async (req, res) => {
  const { parentId, text, nodeType, isTerminal } = req.body;

  const query = 'INSERT INTO chat_nodes (parent_id, text, node_type, is_terminal) VALUES (?, ?, ?, ?)';

  try {
    const results = await executeQuery(query, [parentId, text, nodeType, isTerminal]);
    res.json({ id: results.insertId });
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err.message });
  }
});

// router.get('/nodes/:parentId', async (req, res) => {
//   const parentId = req.params.parentId === 'null' ? null : req.params.parentId;

//   const query = 'SELECT * FROM chat_nodes WHERE parent_id IS ?';
//   try {
//       const results = await executeQuery(query, [parentId]);
//       res.json(results);
//   } catch (err) {
//       res.status(500).json({ error: err.message });
//   }
// });
router.get('/nodes/:parentId', async (req, res) => {
  try {
    // Convert the string 'null' to actual null for the query
    const parentId = req.params.parentId === 'null' ? null : req.params.parentId;


    console.log(parentId, 'parentID')

    // Prepare the query
    const query = parentId ? `SELECT * FROM chat_nodes WHERE parent_id = '${parentId}'` : 'SELECT * FROM chat_nodes WHERE parent_id IS NULL';

    console.log(query, 'query')
    // Execute the query with the parameter
    // const results = await executeQuery(query, parentId ? [parentId] : []);
    const results = await executeQuery(query);
    console.log(results, 'results')
    res.json(results);
  } catch (err) {
    console.error('SQL Error:', err.message);
    res.status(500).json({ error: err.message });
  }
})




// 06-sep-2024/////////



router.post('/api/save-bot-que-ans', authMiddleware, upload1.single('file'), userController.saveBotQueAns)

router.post('/api/get-bot-que-ans', authMiddleware, userController.getBotQueAns)

router.post('/api/get-bot-que', authMiddleware, userController.getBotQue)

router.post("/api/change-bot-status", authMiddleware, userController.changeBotStaus)

router.post("/api/deactive-bot-status", authMiddleware, userController.deactiveBotStaus)

router.post('/api/delete-bot-que-ans', authMiddleware, userController.deleteBotQueAns)

router.post('/api/get-title-root-path', authMiddleware, userController.getTitltRootPath)

router.post('/api/get-ques', userController.getQues)

// router.post('/api/get-ques',botMsgController.getQues)

router.post('/api/delete-bot', authMiddleware, userController.deleteBot)

router.get('/api/get-business-no', authMiddleware, userController.getBusinessNo)




// quick message 

router.post('/api/gettemplate_data', authMiddleware, userController.gettemplate_data)

router.post('/getresponse_msg', authMiddleware, userController.getresponse_msg)


router.get('/getPdf',userController.getPdfData)



router.use('/auth', authRoutes)


router.get('/', (req, res) => {

  res.send('hello world')
})


module.exports = router


