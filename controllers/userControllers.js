const express = require("express");

let { executeQuery } = require("../config/dbConfig");

let helper = require("../utilities/helper");

// function for ramdam number ..................

// This will be 14 characters long

// Function to generate a random alphanumeric string of a given length
function generateRandomString() {
  // Get the current date components
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last two digits of the year
  const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Month (0-11), add 1 and pad with leading zero
  const day = now.getDate().toString().padStart(2, "0"); // Day, pad with leading zero
  const hours = now.getHours().toString().padStart(2, "0"); // Hours, pad with leading zero
  const minutes = now.getMinutes().toString().padStart(2, "0"); // Minutes, pad with leading zero
  const seconds = now.getSeconds().toString().padStart(2, "0"); // Seconds, pad with leading zero

  // Concatenate parts to form a base string
  const baseString = `${year}${month}${day}${hours}${minutes}${seconds}`;

  // Ensure baseString length is <= 16
  const baseStringLength = Math.min(baseString.length, 16);

  // Calculate the remaining length needed to reach 16 characters
  const remainingLength = 16 - baseStringLength;

  // Define the characters to use for random generation
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  // Function to generate random string of given length
  const generateRandomPart = (length) => {
    let result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
  };

  // Generate the remaining part of the random alphanumeric string
  const randomRemaining = generateRandomPart(remainingLength);

  // Concatenate baseString with randomRemaining to form a final 16-character string
  const ramdamNoWithString = `${baseString.slice(
    0,
    16 - remainingLength
  )}${randomRemaining}`;

  return ramdamNoWithString;
}

// Generate the remaining part of the random alphanumeric string

exports.save_botname = async (req, res) => {
  // Get the current date components
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last two digits of the year
  const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Month (0-11), add 1 and pad with leading zero
  const day = now.getDate().toString().padStart(2, "0"); // Day, pad with leading zero
  const hours = now.getHours().toString().padStart(2, "0"); // Hours, pad with leading zero
  const minutes = now.getMinutes().toString().padStart(2, "0"); // Minutes, pad with leading zero
  const seconds = now.getSeconds().toString().padStart(2, "0"); // Seconds, pad with leading zero

  // Concatenate parts to form a base string
  const baseString = `${year}${month}${day}${hours}${minutes}${seconds}`; // This will be 14 characters long

  // Function to generate a random alphanumeric string of a given length
  function generateRandomString(length) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
  }

  // Calculate the remaining length needed to reach 16 characters
  const remainingLength = 16 - baseString.length;

  // Generate the remaining part of the random alphanumeric string
  const randomRemaining = generateRandomString(remainingLength);

  // Concatenate baseString with randomRemaining to form a final 16-character string
  const BotId = `${baseString}${randomRemaining}`;

  // console.log(random16DigitString,'random16DigitString');

  let botname = req.body.name;
  let business_no = req.body.business_no;
  const CurrentDate = helper.currentDate();
  const CurrentTime = helper.currentTime();

  let admin_id = req.user.admin_id;
  let user_id = req.user.user_name;

  let selectqry = "SELECT id FROM bot_controller_tbl WHERE bot_id=?";

  let newdata = await executeQuery(selectqry, [BotId]);

  if (newdata > 0) {
    res.status(200).json({
      msg: "Try again",
    });
  } else {
    let insertquery =
      "INSERT INTO bot_controller_tbl(admin_id,user_id,bot_id,bot_name,business_no,status,created_date,created_time)VALUES(?,?,?,?,?,?,?,?)";
    var paramData = [
      admin_id,
      user_id,
      BotId,
      botname,
      business_no,
      "Inactive",
      CurrentDate,
      CurrentTime,
    ];
    await executeQuery(insertquery, paramData);
    res.status(200).json({
      msg: "success",
    });
  }
};

exports.getBotData = async (req, res) => {
  try {
    // Define the SQL query and parameters
    const selectqry = `SELECT id,admin_id,bot_name, bot_id,user_id,business_no, CASE 
    WHEN status = 1 THEN "deactive" 
    ELSE "active" 
  END AS status, status as change_status,DATE_FORMAT(created_date, "%d-%m-%Y") as c_date  FROM bot_controller_tbl WHERE admin_id = ? AND user_id=?`;
    const paramdataforbot = [req.user.admin_id, req.user.user_name];
    // Execute the query and await the result
    const data = await executeQuery(selectqry, paramdataforbot);

    // Send the data as a JSON response
    res.status(200).json(data);
  } catch (error) {
    // Handle any errors that occur during the query
    console.error("Error fetching bot data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.saveWelcomeMessage = async (req, res) => {
  try {
    const { botId, botName, message } = req.body;
    const CurrentDate = helper.currentDate();
    const CurrentTime = helper.currentTime();
    let insertquery =
      "INSERT INTO q_master(admin_id,user_id,bot_id,bot_name,status,created_date,created_time,question)VALUES(?,?,?,?,?,?,?,?)";
    var paramData = [
      "manthanadmin",
      "session",
      botId,
      botName,
      "0",
      CurrentDate,
      CurrentTime,
      message,
    ];
    await executeQuery(insertquery, paramData);

    res.status(200).json({
      msg: "success",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { botId } = req.query;

    if (!botId) {
      return res.status(400).json({ error: "Bot ID is required" });
    }

    const selectQry =
      "SELECT id, bot_name, status, wel_message FROM welcome_message_tbl WHERE bot_id = ? AND user_id = ? AND admin_id = ?";
    const querData = [botId, "session", "manthanadmin"];

    const rows = await executeQuery(selectQry, querData);

    if (rows.length === 0) {
      return res
        .status(200)
        .json({ message: "No messages found for this bot." });
    }

    res.json(rows);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Server error while fetching messages" });
  }
};

// controllers/botController.js

exports.updateMessageStatus = async (req, res) => {
  try {
    const { messageId, status } = req.body;

    if (!messageId || status === undefined) {
      return res
        .status(400)
        .json({ error: "Message ID and status are required" });
    }

    // Deactivate all messages for this bot
    await executeQuery(
      "UPDATE welcome_message_tbl SET status = 0 WHERE bot_id = (SELECT bot_id FROM welcome_message_tbl WHERE id = ?)",
      [messageId]
    );

    // Update the status of the selected message
    await executeQuery(
      "UPDATE welcome_message_tbl SET status = ? WHERE id = ?",
      [status, messageId]
    );

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Error updating message status:", err);
    res.status(500).json({ error: "Server error while updating status" });
  }
};

//.................... delete bot ..................................

exports.deleteBot = async (req, res) => {
  try {
    const { id, bot_id } = req.body;

    const deleteQue = `
          Delete from bot_controller_tbl  
        WHERE id = ? 
    `;
    const deleteQueParam = [id];

    await executeQuery(deleteQue, deleteQueParam);

    res.status(200).json({ status: 200, message: "Bot delete successfully." });
  } catch (error) {
    // Log the error and send an error response
    console.error("Error saving bot question and answer:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//.................... save bot question answer ..................................

exports.saveBotQueAns = async (req, res) => {
  try {
    // Generate unique identifiers
    const random_q_id = generateRandomString();
    // console.log(req.file.filename, "file name " ,req.file.path);
    let media_url = req.file?.filename ?? "";

    let {
      created_by,
      bot_id,
      business_no,
      question,
      answer,
      msg_type,
      title,
      parent_id,
    } = JSON.parse(req.body.data);
    // Get current date and time
    let admin_id = req.user.admin_id;
    const created_date = helper.currentDate();
    const created_time = helper.currentTime();
    // check title.............
    // Check if the title already exists
    const titleQue = `
          SELECT id 
          FROM new_bot_q_master  
          WHERE ques_title = ? 
            AND admin_id = ?  
            AND bot_id = ?
            AND business_no=?
      `;
    const titleParam = [title, admin_id, bot_id, business_no];

    const checkTitle = await executeQuery(titleQue, titleParam);
    if (checkTitle.length != 0) {
      res.status(201).json({ status: 201, message: "Title already exist." });
    } else {
      const saveAns = `
            INSERT INTO new_bot_q_master 
            (admin_id, created_by, bot_id, business_no, question_id, parent_id, ques_title, question, answer, msg_type,media_url, created_date, created_time, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?);
        `;
      const saveAnsParam = [
        admin_id,
        created_by,
        bot_id,
        business_no,
        random_q_id,
        parent_id,
        title,
        question,
        answer,
        msg_type,
        media_url,
        created_date,
        created_time,
        "1",
      ];
      await executeQuery(saveAns, saveAnsParam);

      res.status(200).json({ status: 200, message: "Success" });
    }
  } catch (error) {
    // Log the error and send an error response
    console.error("Error saving bot question and answer:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//.................... get bot question answer ..................................

exports.getBotQueAns = async (req, res) => {
  try {
    let { parent_id, bot_id } = req.body;
    const getQueAns =
      "SELECT id,admin_id, created_by, bot_id, business_no, question, answer, msg_type,media_url FROM  new_bot_q_master WHERE parent_id = ? and bot_id=? and admin_id=? and created_by=?";
    const getQueAnsParam = [
      parent_id,
      bot_id,
      req.user.admin_id,
      req.user.user_name,
    ];
    const getQueAnsData = await executeQuery(getQueAns, getQueAnsParam);
    res.status(200).json({
      message: "Question answer details",
      data: getQueAnsData,
    });
  } catch (error) {
    console.error("Error fetching bot data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//.................. select question .....................
exports.getBotQue = async (req, res) => {
  try {
    let { admin_id, created_by, bot_id } = req.body;

    const getQueAns =
      "SELECT question_id,question,ques_title FROM new_bot_q_master WHERE bot_id=?";
    const getQueAnsParam = [bot_id];
    const getQueAnsData = await executeQuery(getQueAns, getQueAnsParam);
    res.status(200).json({
      message: "Question answer details",
      data: getQueAnsData,
    });
  } catch (error) {
    console.error("Error fetching bot data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//.................... delete bot question answer ..................................

exports.deleteBotQueAns = async (req, res) => {
  try {
    const id = req.body.id;
    const deleteQues = "delete from new_bot_q_master WHERE id =?;";
    const deleteQuesParam = [id];
    await executeQuery(deleteQues, deleteQuesParam);
    res.status(200).json({
      status: 200,
      message: "Data deleted successfully.",
    });
  } catch (error) {
    console.error("Error fetching bot data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//....................get title root ..................................
exports.getTitltRootPath = async (req, res) => {
  try {
    const { question_id, bot_id } = req.body;

    const rootQue1 = `select question_id from new_bot_q_master where bot_id=? LIMIT 1;
    `;
    const getRootParam1 = [bot_id];
    const data1 = await executeQuery(rootQue1, getRootParam1);
    console.log(data1[0].question_id, "first Quses");
    let que_id;
    if (question_id === "Wel_101") {
      que_id = data1[0].question_id;
    } else {
      que_id = question_id;
    }

    const rootQue = `WITH RECURSIVE QuestionHierarchy AS (
    -- Anchor member: Start with the specified question_id (replace 6 with the desired question_id)
    SELECT
        question_id,
        parent_id,
        ques_title,
        CAST(ques_title AS CHAR(255)) AS hierarchy,
        0 AS level
    FROM
        new_bot_q_master
    WHERE
        question_id = ?

    UNION ALL

    -- Recursive member: Join with parent questions
    SELECT
        q.question_id,
        q.parent_id,
        q.ques_title,
        CONCAT(q.ques_title, '->', qh.hierarchy) AS hierarchy,
        qh.level + 1 AS level
    FROM
        new_bot_q_master q
    INNER JOIN
        QuestionHierarchy qh
    ON
        q.question_id = qh.parent_id
)

-- Select the final hierarchy path, ensuring correct order from root to target
SELECT
    hierarchy
FROM
    QuestionHierarchy
ORDER BY
    level DESC
LIMIT 1;
`;
    const getRootParam = [que_id];
    const data = await executeQuery(rootQue, getRootParam);
    res.status(200).json({
      message: "Data deleted successfully.",
      data: data,
    });
  } catch (error) {
    console.error("Error fetching bot data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//.................... active deactive bot  ..................................
exports.changeBotStaus = async (req, res) => {
  try {
    const { id, business_no } = req.body;

    const updateStatus =
      "update bot_controller_tbl set status=2 where id=? and business_no=?;";
    const updateStatusParam = [id, business_no];
    await executeQuery(updateStatus, updateStatusParam);
    const updateStatus1 =
      "update bot_controller_tbl set status=1 where id<>? and business_no=?;";
    const updateStatusParam1 = [id, business_no];
    await executeQuery(updateStatus1, updateStatusParam1);
    res.status(200).json({
      status: 200,
      message: "updated successfully.",
    });
  } catch (error) {
    console.error("Error fetching bot data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//.................... active deactive bot  ..................................
exports.deactiveBotStaus = async (req, res) => {
  try {
    const { id } = req.body;

    const updateStatus = "update bot_controller_tbl set status=1 where id=?;";
    const updateStatusParam = [id];
    await executeQuery(updateStatus, updateStatusParam);

    res.status(200).json({
      status: 200,
      message: "Bot status deactive successfully.",
    });
  } catch (error) {
    console.error("Error fetching bot data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//.................. function for check transaction status .................
async function getTransStatus(user_id, totalAmount) {
  const getTransStatus = `call check_trans_status(?,?); `;
  const transParam = [user_id, totalAmount];
  const getTranStatus = await executeQuery(getTransStatus, transParam);
  return getTranStatus[0][0].trans_status;
}

exports.getQues = async (req, res) => {
  try {
    const jsonString = req.body;
    // Function to check if a key exists in a nested object
    // console.log(jsonString);
    const data = jsonString;

    const keyExists = (obj, key) => {
      // Check if the key exists in the object directly
      if (key in obj) return true;

      // Iterate through the object and check nested objects
      for (let k in obj) {
        if (obj.hasOwnProperty(k) && typeof obj[k] === "object") {
          if (keyExists(obj[k], key)) return true;
        }
      }

      return false;
    };

    // Check if 'statuses' key exists
    const statusKeyExists = keyExists(data, "statuses");
    if (statusKeyExists == true) {
      const data = JSON.parse(jsonString);

      // Function to extract id and status from statuses array
      const extractStatusInfo = (obj) => {
        const statuses = obj?.entry?.[0]?.changes?.[0]?.value?.statuses;

        if (Array.isArray(statuses)) {
          return statuses.map((status) => ({
            id: status.id,
            status: status.status,
          }));
        }

        return [];
      };

      // Extract id and status
      const statusInfo = extractStatusInfo(data);
      const message_id = statusInfo[0].id;
      const status = statusInfo[0].status;
      const event_date = helper.currentDate();
      const event_time = helper.currentTime();
      const updateQue = "call update_status(?,?,?,?)";
      const updateQueParm = [message_id, status, event_date, event_time];
      await executeQuery(updateQueParm, updateQue);
    } else {
      // Extract the data
      const entry = data.entry[0];
      const changes = entry.changes[0];
      const value = changes.value;

      const business_no = value.metadata.display_phone_number;
      const cus_profile_name = value.contacts[0].profile.name;
      // const cus_mobile_no = value.contacts[0].wa_id;

      const message = value.messages[0];
      const cus_mobile_no = message.from;
      const message_id = message.id;
      const timestamp = message.timestamp;
      const message_type = message.type;
      console.log(message_type, "message_type");

      if (message_type == "document") {
        const message = data.entry[0].changes[0].value.messages[0];
        const document = message.document;
        const filename = document.filename;
        const mimeType = document.mime_type;
        const id = document.id;
      } else if (message_type == "image") {
        const message = data.entry[0].changes[0].value.messages[0];
        const image = message.image;
        const filename = image ? "N/A" : undefined; // No filename field for image type
        const mimeType = image.mime_type;
        const id = image.id;
      }

      const body = message.text.body;
      await getQuestion(
        business_no,
        cus_profile_name,
        cus_mobile_no,
        message_id,
        message_type,
        body
      );
      res.status(200).json({
        message: "Success",
      });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({
      err: error,
    });
  }
};

async function getQuestion(
  business_number,
  cus_profile_name,
  cus_mobile_no,
  message_id,
  message_type,
  body
) {
  try {
    const send_date = helper.currentDate();
    const send_time = helper.currentTime();
    const business_no = business_number;
    const sender_profile_name = cus_profile_name;
    const sender_mobile = cus_mobile_no;
    const re_message_id = message_id;
    const msg_type = message_type;
    const msg = body;

    const msg_role = "Session";
    //......................get price ....................................................
    const getPrice =
      "SELECT sess_price_24,hsm_price,plt_price,price_type,user_id FROM wp_price_setup_tbl where business_no=?;";
    const paranBuss = [business_no];
    const getPriceData = await executeQuery(getPrice, paranBuss);
    let sess_price_24 = getPriceData[0].sess_price_24;
    let hsm_price = getPriceData[0].hsm_price;
    let plt_price = getPriceData[0].plt_price;
    let price_type = getPriceData[0].price_type;
    let session_price = 0;
    // let totalAmount = sess_price_24 + plt_price;
    let totalAmount = 0;
    let user_id = getPriceData[0].user_id;

    const activity = "";
    const delivery_status = "Accepted";
    const event_date = "";
    const event_time = "";
    const read_status = "";
    // ................. get active user data ......................
    const selectqry =
      "SELECT wp_business_no_mst.admin_id,bot_controller_tbl.user_id as created_by ,bot_id,api_key,wanumber,api_version FROM bot_controller_tbl inner join wp_business_no_mst on wp_business_no_mst.business_no=bot_controller_tbl.business_no where bot_controller_tbl.business_no=? and bot_controller_tbl.status=2;";
    const paramdataforbot = [business_no];
    const botData = await executeQuery(selectqry, paramdataforbot);

    let agent_id = "";
    //...........check session status..............................
    let api_key = botData[0].api_key;
    let wanumber = botData[0].wanumber;

    let api_version = botData[0].api_version;
    const check24Hours = `call check_current_status(?,?,?,?); `;
    const check24Param = [
      business_no,
      sender_mobile,
      botData[0].admin_id,
      botData[0].created_by,
    ];
    const getSessStatus = await executeQuery(check24Hours, check24Param);
    const sess_status = getSessStatus[0][0].sess_status;
    if (sess_status == 0) {
      sess_price_24 = 0;
      totalAmount = sess_price_24 + plt_price; // only plt_price if session exist with 24 hours
    } else {
      totalAmount = parseFloat(sess_price_24) + parseFloat(plt_price); // if session not exist with 24 hours
    }

    //................ end session status........................
    if (botData.length != 0) {
      const myMsg = msg.toUpperCase();
      if (myMsg == "HI" || myMsg == "HELLO") {
        const selectqry =
          "SELECT answer,question,question_id,parent_id,ques_title,msg_type FROM new_bot_q_master where question=? and bot_id=?;";
        const paramdataforbot = [msg, botData[0].bot_id];
        const mesData = await executeQuery(selectqry, paramdataforbot);

        const question_id = mesData[0].question_id;
        const parent_id = mesData[0].parent_id;
        const ques_title = mesData[0].ques_title;
        const msg_type = mesData[0].msg_type;

        // .............. insert in_message ............................
        const checkMessage = `INSERT INTO wp_send_bot_tbl (
                admin_id, created_by, bot_id, business_no, agent_id, sender_mobile, 
                sender_profile_name, msg_id, question_id, parent_id, ques_title, msg,
                msg_type, activity, send_date, send_time, delivery_status, msg_role, 
                event_date, event_time, read_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;
        const paramData = [
          botData[0].admin_id || "manthan_admin",
          botData[0].created_by || "",
          botData[0].bot_id || "",
          business_no || "",
          agent_id || "",
          sender_mobile || "",
          sender_profile_name || "",
          message_id || "",
          question_id || "",
          parent_id || "",
          ques_title || "",
          msg,
          mesData[0].msg_type || "",
          activity || "in_msg",
          send_date || "",
          send_time || "",
          delivery_status || "",
          msg_role || "",
          event_date || "",
          event_time || "",
          read_status || "",
        ];

        await executeQuery(checkMessage, paramData);

        //..........Api Hit in meta send session message...........

        const flag = await getTransStatus(user_id, totalAmount);
        if (flag == 1) {
          let responseData = await sendSessionMsg(
            sender_mobile,
            msg_type,
            mesData[0].answer,
            wanumber,
            api_key,
            api_version
          );
          let msgId = await getMessagesId(responseData);

          //..............end api..................................

          const checkmessage1 = `INSERT INTO wp_send_bot_tbl (admin_id, created_by, bot_id, business_no, agent_id, sender_mobile, sender_profile_name, msg_id, question_id, parent_id,ques_title, msg, msg_type, activity, send_date, send_time, delivery_status, msg_role, event_date, event_time, read_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;
          const paramData1 = [
            botData[0].admin_id || "manthan_admin",
            botData[0].created_by || "",
            botData[0].bot_id || "",
            business_no || "",
            agent_id || "",
            sender_mobile || "",
            sender_profile_name || "",
            msgId || "",
            question_id || "",
            parent_id || "",
            ques_title || "",
            mesData[0].answer || "",
            botData[0].msg_type || "",
            activity || "out_msg",
            send_date || "",
            send_time || "",
            delivery_status || "",
            msg_role || "",
            event_date || "",
            event_time || "",
            read_status || "",
          ];
          await executeQuery(checkmessage1, paramData1);
        }
      } else {
        // ................... start bot ................
        const selectqry = `SELECT question_id,parent_id,ques_title msg
                   FROM wp_send_bot_tbl
                   WHERE business_no = ?
                   AND sender_mobile = ?
                   AND activity="out_msg"
                   AND bot_id=?
                   AND CONCAT(send_date, ' ', send_time) >= NOW() - INTERVAL 1 HOUR
                   ORDER BY id DESC
                   LIMIT 1;`;
        const paramdataforbot = [business_no, sender_mobile, botData[0].bot_id];
        const mesData = await executeQuery(selectqry, paramdataforbot);

        if (mesData.length != 0) {
          const question_id = mesData[0].question_id;
          const parent_id = mesData[0].parent_id;
          const ques_title = mesData[0].ques_title;
          //......................  get bot  ..............

          const selectqry =
            "SELECT answer,question_id,parent_id,ques_title,msg_type FROM new_bot_q_master where bot_id=? and question=? and parent_id=?;";
          const paramdataforbot = [botData[0].bot_id, msg, question_id];
          const mesData1 = await executeQuery(selectqry, paramdataforbot);

          //............ end ...........................
          if (mesData1.length == 0) {
            // ............ for invalid option seclection.............
            const checkmessage = `INSERT INTO wp_send_bot_tbl (
                    admin_id, created_by, bot_id, business_no, agent_id, sender_mobile,
                    sender_profile_name, msg_id, question_id, parent_id, ques_title, msg,
                    msg_type, activity, send_date, send_time, delivery_status, msg_role,
                    event_date, event_time, read_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;
            const paramData = [
              botData[0].admin_id || "manthan_admin",
              botData[0].created_by || "",
              botData[0].bot_id || "",
              business_no || "",
              agent_id || "",
              sender_mobile || "",
              sender_profile_name || "",
              message_id || "",
              mesData[0].question_id || "",
              mesData[0].parent_id || "",
              mesData[0].ques_title || "",
              msg || "",
              msg_type || "",
              activity || "in_msg",
              send_date || "",
              send_time || "",
              delivery_status || "",
              msg_role || "",
              event_date || "",
              event_time || "",
              read_status || "",
            ];
            await executeQuery(checkmessage, paramData);
            const message = "Please enter valid option.";

            //..........Api Hit in meta send session message...........
            const flag = await getTransStatus(user_id, totalAmount);
            if (flag == 1) {
              let responseData = await sendSessionMsg(
                sender_mobile,
                msg_type,
                message,
                wanumber,
                api_key,
                api_version
              );
              let msgId = await getMessagesId(responseData);
              //..............end api..................................
              const checkmessage1 = `INSERT INTO wp_send_bot_tbl (
                    admin_id, created_by, bot_id, business_no, agent_id, sender_mobile,
                    sender_profile_name, msg_id, question_id, parent_id, ques_title, msg,
                    msg_type, activity, send_date, send_time, delivery_status, msg_role,
                    event_date, event_time, read_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;
              const paramData1 = [
                botData[0].admin_id || "manthan_admin",
                botData[0].created_by || "",
                botData[0].bot_id || "",
                business_no || "",
                agent_id || "",
                sender_mobile || "",
                sender_profile_name || "",
                msgId || "",
                mesData[0].question_id || "",
                mesData[0].parent_id || "",
                mesData[0].ques_title || "",
                message,
                botData[0].msg_type || "",
                activity || "out_msg",
                send_date || "",
                send_time || "",
                delivery_status || "",
                msg_role || "",
                event_date || "",
                event_time || "",
                read_status || "",
              ];
              await executeQuery(checkmessage1, paramData1);
            }
          } else {
            const question_id = mesData1[0].question_id;
            const parent_id = mesData1[0].parent_id;
            const ques_title = mesData1[0].ques_title;
            // .............. insert in_message ............................
            const checkmessage = `INSERT INTO wp_send_bot_tbl (
                    admin_id, created_by, bot_id, business_no, agent_id, sender_mobile,
                    sender_profile_name, msg_id, question_id, parent_id, ques_title, msg,
                    msg_type, activity, send_date, send_time, delivery_status, msg_role,
                    event_date, event_time, read_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;
            const paramData = [
              botData[0].admin_id || "manthan_admin",
              botData[0].created_by || "",
              botData[0].bot_id || "",
              business_no || "",
              agent_id || "",
              sender_mobile || "",
              sender_profile_name || "",
              message_id || "",
              mesData[0].question_id || "",
              mesData[0].parent_id || "",
              mesData[0].ques_title || "",
              msg || "",
              msg_type || "",
              activity || "in_msg",
              send_date || "",
              send_time || "",
              delivery_status || "",
              msg_role || "",
              event_date || "",
              event_time || "",
              read_status || "",
            ];

            await executeQuery(checkmessage, paramData);

            //..........Api Hit in meta send session message...........
            const flag = await getTransStatus(user_id, totalAmount);
            if (flag == 1) {
              let responseData = await sendSessionMsg(
                sender_mobile,
                mesData1[0].msg_type,
                mesData1[0].answer,
                wanumber,
                api_key,
                api_version
              );
              let msgId = await getMessagesId(responseData);

              //..............end api..................................

              const checkmessage1 = `INSERT INTO wp_send_bot_tbl (
                    admin_id, created_by, bot_id, business_no, agent_id, sender_mobile,
                    sender_profile_name, msg_id, question_id, parent_id, ques_title, msg,
                    msg_type, activity, send_date, send_time, delivery_status, msg_role,
                    event_date, event_time, read_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;
              const paramData1 = [
                botData[0].admin_id || "manthan_admin",
                botData[0].created_by || "",
                botData[0].bot_id || "",
                business_no || "",
                agent_id || "",
                sender_mobile || "",
                sender_profile_name || "",
                msgId || "",
                mesData1[0].question_id || "",
                mesData1[0].parent_id || "",
                mesData1[0].ques_title || "",
                mesData1[0].answer || "",
                mesData1[0].msg_type || "",
                activity || "out_msg",
                send_date || "",
                send_time || "",
                delivery_status || "",
                msg_role || "",
                event_date || "",
                event_time || "",
                read_status || "",
              ];
              await executeQuery(checkmessage1, paramData1);
            }
          }
        } else {
          //...........................default msg welcome..........
          const selectqry =
            "SELECT answer,question_id, parent_id, ques_title,msg_type FROM new_bot_q_master where bot_id=? order by id desc;";
          const paramdataforbot = [msg, botData[0].bot_id];
          const mesData = await executeQuery(selectqry, paramdataforbot);
          // ................ inserted in message .....................................

          const checkmessage = `INSERT INTO wp_send_bot_tbl (admin_id, created_by, bot_id, business_no, agent_id, sender_mobile, sender_profile_name, msg_id, question_id, parent_id, ques_title, msg, msg_type, activity, send_date, send_time, delivery_status, msg_role, event_date, event_time, read_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;
          const paramData = [
            botData[0].admin_id || "manthan_admin",
            botData[0].created_by || "",
            botData[0].bot_id || "",
            business_no || "",
            agent_id || "",
            sender_mobile || "",
            sender_profile_name || "",
            message_id || "",
            mesData[0].question_id || "",
            mesData[0].parent_id || "",
            mesData[0].ques_title || "",
            msg || "",
            msg_type || "",
            activity || "in_msg",
            send_date || "",
            send_time || "",
            delivery_status || "",
            msg_role || "",
            event_date || "",
            event_time || "",
            read_status || "",
          ];
          await executeQuery(checkmessage, paramData);

          //..........Api Hit in meta send session message...........
          const flag = await getTransStatus(user_id, totalAmount);
          if (flag == 1) {
            let responseData = await sendSessionMsg(
              sender_mobile,
              mesData[0].msg_type,
              mesData[0].answer,
              wanumber,
              api_key,
              api_version
            );
            let msgId = getMessagesId(responseData);

            //..............end api..................................

            const checkmessage1 = `INSERT INTO wp_send_bot_tbl (admin_id, created_by, bot_id, business_no, agent_id, sender_mobile, sender_profile_name, msg_id, question_id, parent_id, ques_title, msg, msg_type, activity, send_date, send_time, delivery_status, msg_role, event_date, event_time, read_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;
            const paramData1 = [
              botData[0].admin_id || "manthan_admin",
              botData[0].created_by || "",
              botData[0].bot_id || "",
              business_no || "",
              agent_id || "",
              sender_mobile || "",
              sender_profile_name || "",
              msgId || "",
              mesData[0].question_id || "",
              mesData[0].parent_id || "",
              mesData[0].ques_title || "",
              mesData[0].answer || "",
              mesData[0].msg_type || "",
              activity || "out_msg",
              send_date || "",
              send_time || "",
              delivery_status || "",
              msg_role || "",
              event_date || "",
              event_time || "",
              read_status || "",
            ];
            await executeQuery(checkmessage1, paramData1);
          }
          //.....................end msg default..................
        }
        // ................... end bot ...................
      }
    } else {
      console.log("bot not found.");
    }
  } catch (error) {
    console.error("Error fetching bot data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getMessagesId(response) {
  // console.log(response, 'response')
  const data = JSON.parse(response);

  return data.messages[0].id;
}

//  .............. HSM
async function sendHSMMsg() {
  const axios = require("axios");
  let data = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: "917696353042",
    type: "template",
    template: {
      language: {
        code: "en",
      },

      name: "phone_number",

      components: [
        {
          type: "body",

          parameters: [],
        },
      ],
    },
  });

  let config = {
    method: "post",

    maxBodyLength: Infinity,

    url: "https://partners.pinbot.ai/v1/messages",

    headers: {
      wanumber: "919315797343",

      apikey: "1c741891-b9d4-11ee-b22d-92672d2d0c2d",

      "Content-Type": "application/json",
    },

    data: data,
  };

  axios
    .request(config)

    .then((response) => {
      let resData = JSON.stringify(response.data);
      return resData;
    })

    .catch((error) => {
      console.log(error);
    });

  // return "1234qwerty"
}

const axios = require("axios");
async function sendSessionMsg(
  to,
  msgtype,
  body,
  wanmber,
  api_key,
  api_version
) {
  let res1 = "";
  // let res="";
  try {
    let data = JSON.stringify({
      messaging_product: "whatsapp",

      preview_url: false,

      recipient_type: "individual",

      to: to,

      type: msgtype,

      text: {
        body: body,
      },
    });

    let config = {
      method: "post",

      maxBodyLength: Infinity,

      url: "https://partners.pinbot.ai/v1/messages",

      headers: {
        wanumber: wanmber,

        apikey: api_key,

        "Content-Type": "application/json",
      },
      data: data,
    };

    await axios
      .request(config)
      .then((response) => {
        res1 = JSON.stringify(response.data);
        console.log(JSON.stringify(response.data));
      })

      .catch((error) => {
        console.log(error);
      });

    return res1;
  } catch (error) {
    console.error("Error fetching bot data:", error);
  }
}

// quick message
exports.gettemplate_data = async (req, res) => {
  try {
    let { templatetype } = req.body;

    let selectqry;

    let querydata;

    if (templatetype == "Text") {
      selectqry =
        "SELECT temp_name,temp_id FROM wp_template_tbl WHERE admin_id=? AND user_id=? AND t_type=? AND status=?";

      querydata = [req.user.admin_id, "mayankmotors", templatetype, "APPROVED"];
    } else {
      let newtemtype = "Media";

      selectqry =
        "SELECT temp_name,temp_id FROM wp_template_tbl WHERE admin_id=? AND user_id=? AND t_type=? AND status=? AND media_type=? ";

      querydata = [
        req.user.admin_id,
        "mayankmotors",
        newtemtype,
        "APPROVED",
        templatetype,
      ];
    }

    console.log(selectqry, "selectqry");

    console.log(querydata, "querydata");

    // let selectqry='SELECT temp_name,temp_id FROM wp_template_tbl WHERE admin_id=? AND user_id=? AND t_type=? AND status=?';
    let responsedata = await executeQuery(selectqry, querydata);

    console.log(responsedata, "responsedata");

    // console.log(responsedata,'responsedata')
    res.status(200).json({
      data: responsedata,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getresponse_msg = async (req, res) => {
  try {
    let { templatename } = req.body;

    let slctqry =
      "SELECT message,file_doc,t_url FROM wp_template_tbl WHERE  admin_id=? AND user_id=? AND temp_name=? AND status=? ";

    let paramsdata = [
      req.user.admin_id,
      req.user.user_name,
      templatename,
      "APPROVED",
    ];
    respon = await executeQuery(slctqry, paramsdata);

    res.status(200).json({
      data: respon[0],
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getBusinessNo = async (req, res) => {
  try {
    const getBusinessNo =
      "SELECT business_no from wp_business_no_mst where status=1 and admin_id=? and user_id=? ";
    const getBusinessNoParam = [req.user.admin_id, req.user.user_name];

    const getBusinessData = await executeQuery(
      getBusinessNo,
      getBusinessNoParam
    );

    console.log(getBusinessData, "getBusinessData");
    res.status(200).json({
      message: "Success.",
      data: getBusinessData,
    });
  } catch (error) {
    console.error("Error fetching bot data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// const axios = require('axios');
exports.getPdfData = async (req, res) => {
  let mediaid = "1039306424541322";
  let config = {
    method: "get",

    maxBodyLength: Infinity,

    url: "https://partners.pinbot.ai/v1/downloadmedia/1039306424541322",

    headers: {
      wanumber: "917701866916",

      apikey: "1c741891-b9d4-11ee-b22d-92672d2d0c2d",
    },
  };

  axios
    .request(config)

    .then((response) => {
      console.log(JSON.stringify(response.data), "response");
    })

    .catch((error) => {
      console.log(error);
    });
};
