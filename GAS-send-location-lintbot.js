const scriptProperties = PropertiesService.getScriptProperties();
const ACCESS_TOKEN = scriptProperties.getProperty('CHANNEL_ACCESS_TOKEN');
const SHEET_ID = scriptProperties.getProperty('SHEET_ID');
const LIFF_TARGET_ID = scriptProperties.getProperty('LIFF_TARGET_ID');

Logger = BetterLog.useSpreadsheet(SHEET_ID);
function doPost(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Users");
  
  let contents;
  try {
    contents = JSON.parse(e.postData.contents);
  } catch(err) {
    return; 
  }

  // --- กรณีที่ 1: รับข้อมูลจากหน้า PHP (คนขับส่งพิกัด) ---
  if (contents.action === "driver_update_location") {
    Logger.log("driver update location");
    return handleDriverLocation(contents, sheet);
  }

  // --- กรณีที่ 2: รับข้อมูลจาก LINE Webhook (คนกดปุ่มขอพิกัด) ---
  const event = contents.events[0];
  if (event.type === "message") {
    const userId = event.source.userId;
    const msg = event.message.text;

    if (msg === "ลงทะเบียนผู้รับบริการ") {
    // ตรวจสอบ/เพิ่ม User ลงในระบบถ้ายังไม่มี
    checkAndAddUser(sheet, userId, "user");
    }else if(msg === "ลงทะเบียนคนขับ"){
      checkAndAddUser(sheet, userId, "driver");
    }else if (msg === "ขอตำแหน่งรถ") {
      processRequest(userId, sheet);
    }else{

    }
  }
}

// ฟังก์ชันตรวจสอบและเพิ่ม User/Driver ลง Sheet อัตโนมัติ
function checkAndAddUser(sheet, userId, role) {
  const data = sheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      found = true;
      break;
    }
  }
  if (!found) {
    //เพิ่มข้อมูลลง sheet ถ้า role = driver ให้ status = available
    sheet.appendRow([userId, role, role === "driver" ? "available" : "", ""]); 
  }
}

function processRequest(userId,sheet) {
  // Logger.log("userId " + userId);
  // Logger.log("sheet name" + sheet);
  const data = sheet.getDataRange().getValues();
  let driverId = "";
  // ค้นหาคนขับที่สถานะ available
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === "driver" && data[i][2] === "available") {
      driverId = data[i][0];
      sheet.getRange(i + 1, 4).setValue(userId); // บันทึก targetId (ผู้ใช้ที่ขอมา)
      sheet.getRange(i + 1, 3).setValue("");// เปลี่ยน status จาก available เป็นค่าว่าง (ป้องกันการเรียกซ้ำ)
      break;
    }
  }

  if (driverId) {
    sendFlexToDriver(driverId);
    pushTextMessage(userId, [{ "type": "text", "text": "กำลังติดต่อคนขับที่ว่างอยู่... กรุณารอสักครู่" }]);
  } else {
    pushTextMessage(userId, [{ "type": "text", "text": "ขณะนี้ไม่มีคนขับว่างในระบบ" }]);
  }
}

// ฟังก์ชันส่ง Flex Message ให้คนขับกดเปิด LIFF
function sendFlexToDriver(driverId) {
  const flexData = {
    "type": "bubble",
    "hero": { "type": "image", "url": "https://cdn-icons-png.flaticon.com/512/2335/2335353.png", "size": "full", "aspectRatio": "20:13", "aspectMode": "cover" },
    "body": {
      "type": "box", "layout": "vertical", "contents": [
        { "type": "text", "text": "มีการขอพิกัดจากผู้รับบริการ", "weight": "bold", "size": "xl" },
        { "type": "text", "text": "กรุณากดปุ่มเพื่อส่งตำแหน่งปัจจุบันของคุณให้ผู้ใช้", "wrap": true, "margin": "md" }
      ]
    },
    "footer": {
      "type": "box", "layout": "vertical", "contents": [
        { "type": "button", "style": "primary", "color": "#05B743", 
          "action": { "type": "uri", "label": "ส่งตำแหน่งของฉัน", "uri": "https://liff.line.me/"+LIFF_TARGET_ID } 
        }
      ]
    }
  };
  pushFlexMessage(driverId, "มีคำขอตำแหน่ง!", flexData);
}

// แก้ไขฟังก์ชัน handleDriverLocation ให้รองรับการทำงานจาก PHP
function handleDriverLocation(data, sheet) {
  const rows = sheet.getDataRange().getValues();
  let targetUserId = "";
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.driverId) {
      targetUserId = rows[i][3]; // ช่อง targetId (Column D)
      sheet.getRange(i + 1, 4).setValue(""); // ส่งแล้วเคลียร์ค่าทิ้ง
      sheet.getRange(i + 1, 3).setValue('available');// เปลี่ยน status เป็น available ตามเดิม
      break;
    }
  }

  if (targetUserId) {
    pushTextMessage(targetUserId, [{
      "type": "location",
      "title": "ตำแหน่งคนขับมาแล้ว!",
      "address": "พิกัดปัจจุบัน",
      "latitude": data.lat,
      "longitude": data.lon
    }]);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  }
  return ContentService.createTextOutput("No Target User Found").setMimeType(ContentService.MimeType.TEXT);
}

// ฟังก์ชันช่วยส่ง Push Message
function pushFlexMessage(to, text, flex) {
  const url = "https://api.line.me/v2/bot/message/push";
  const payload = {
    "to": to,
    "messages": flex ? [{ "type": "flex", "altText": text, "contents": flex }] : [{ "type": "text", "text": text }]
  };
  UrlFetchApp.fetch(url, {
    "method": "post",
    "headers": { "Content-Type": "application/json", "Authorization": "Bearer " + ACCESS_TOKEN },
    "payload": JSON.stringify(payload)
  });
}

function pushTextMessage(to,text) {
  const url = 'https://api.line.me/v2/bot/message/push';

  const payload = {
    "to": to,
    "messages": text
  };

  const options = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + ACCESS_TOKEN
    },
    "payload": JSON.stringify(payload)
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    Logger.log(response.getContentText());
  } catch (e) {
    Logger.log("Error: " + e.message);
  }
}
