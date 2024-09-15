let { executeQuery } = require('../config/dbConfig')


let helper = require('../utilities/helper')

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
          if (obj.hasOwnProperty(k) && typeof obj[k] === 'object') {
            if (keyExists(obj[k], key)) return true;
          }
        }
  
        return false;
      };
  
      // Check if 'statuses' key exists
      const statusKeyExists = keyExists(data, 'statuses');
      if (statusKeyExists == true) {
  
        const data = JSON.parse(jsonString);
  
        // Function to extract id and status from statuses array
        const extractStatusInfo = (obj) => {
          const statuses = obj?.entry?.[0]?.changes?.[0]?.value?.statuses;
  
          if (Array.isArray(statuses)) {
            return statuses.map(status => ({
              id: status.id,
              status: status.status
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
        const updateQue =
          "call update_status(?,?,?,?)";
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
        const body = message.text.body;
        // console.log(business_no, cus_profile_name, cus_mobile_no, message_id, message_type, body);
  
        await getQuestion(business_no, cus_profile_name, cus_mobile_no, message_id, message_type, body)
        res.status(200).json({
          message: "Success"
        })
      }
    } catch (error) {
      console.log(error);
  
      res.status(500).json({
        err: error
      })
    }
  };
  
  async function getQuestion(business_number, cus_profile_name, cus_mobile_no, message_id, message_type, body) {
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
        botData[0].created_by
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
  
            let responseData = await sendSessionMsg(sender_mobile, msg_type, mesData[0].answer, wanumber, api_key, api_version);
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
                let responseData = await sendSessionMsg(sender_mobile, msg_type, message, wanumber, api_key, api_version);
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
                let responseData = await sendSessionMsg(sender_mobile, mesData1[0].msg_type, mesData1[0].answer, wanumber, api_key, api_version);
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
  
              let responseData = await sendSessionMsg(sender_mobile, mesData[0].msg_type, mesData[0].answer, wanumber, api_key, api_version);
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
  
  
    return data.messages[0].id
  }
  
  //  .............. HSM 
  async function sendHSMMsg() {
  
  
  
    const axios = require('axios');
    let data = JSON.stringify({
      "messaging_product": "whatsapp",
      "recipient_type": "individual",
      "to": "917696353042",
      "type": "template",
      "template": {
  
        "language": {
  
          "code": "en"
  
        },
  
        "name": "phone_number",
  
        "components": [
  
          {
  
            "type": "body",
  
            "parameters": []
  
          }
  
        ]
  
      }
  
    });
  
  
  
    let config = {
  
      method: 'post',
  
      maxBodyLength: Infinity,
  
      url: 'https://partners.pinbot.ai/v1/messages',
  
      headers: {
  
        'wanumber': '919315797343',
  
        'apikey': '1c741891-b9d4-11ee-b22d-92672d2d0c2d',
  
        'Content-Type': 'application/json'
  
      },
  
      data: data
  
    };
  
  
  
    axios.request(config)
  
      .then((response) => {
  
        let resData = JSON.stringify(response.data);
        return resData
      })
  
      .catch((error) => {
  
        console.log(error);
  
      });
  
  
    // return "1234qwerty"
  }
  
  
  const axios = require('axios');
  async function sendSessionMsg(to, msgtype, body, wanmber, api_key, api_version) {
    let res1 = "";
    // let res="";
    try {
  
      let data = JSON.stringify({
  
        "messaging_product": "whatsapp",
  
        "preview_url": false,
  
        "recipient_type": "individual",
  
        "to": to,
  
        "type": msgtype,
  
        "text": {
  
          "body": body
  
        }
  
      });
  
  
  
      let config = {
  
        method: 'post',
  
        maxBodyLength: Infinity,
  
        url: 'https://partners.pinbot.ai/v1/messages',
  
        headers: {
  
          'wanumber': wanmber,
  
          'apikey': api_key,
  
          'Content-Type': 'application/json'
  
        },
        data: data
      };
  
  
      await axios.request(config)
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
  