function doPost(e) {
  var ssId = "<Your sheet ID>";
  var ss = SpreadsheetApp.openByUrl("<Your sheet URL>");
  var sheet = ss.getSheetByName("<Sheet Name>");

  //use BetterLog
  Logger = BetterLog.useSpreadsheet(ssId);

  var data = JSON.parse(e.postData.contents)
  //Logger.log(data);

  var userMsg = data.originalDetectIntentRequest.payload.data.message.text;
  var values = sheet.getRange(2, 3, sheet.getLastRow(),sheet.getLastColumn()).getValues();

  var requestJSON = e.postData.contents;
  Logger.log(requestJSON);

  var userMessage = JSON.parse(requestJSON).queryResult.queryText;
  var intent = JSON.parse(requestJSON).queryResult.intent.displayName;
  var userId = JSON.parse(requestJSON).originalDetectIntentRequest.payload.data.source.userId;

  var sheet2 = ss.getSheetByName("message");
  var lastRow = sheet2.getLastRow() + 1;

  sheet2.getRange(lastRow,1).setValue(userMessage);
  sheet2.getRange(lastRow,2).setValue(intent);
  sheet2.getRange(lastRow,3).setValue(userId);

  for(var i = 0;i<values.length; i++){ 
    //if(values[i][0] == userMsg ){
    if (values[i][0].toString().includes(userMsg)) {
      i=i+2;
      var name = sheet.getRange(i,3).getValue(); //ชื่อ-สกุล
      var address = sheet.getRange(i,4).getValue() + ' ถนน' + sheet.getRange(i,6).getValue(); //ที่อยู่
      var address2 = 'ต.' +sheet.getRange(i,7).getValue() + ' อ.' +sheet.getRange(i,8).getValue() + ' จ.' +sheet.getRange(i,9).getValue() + ' ' + sheet.getRange(i,10).getValue();  //ที่อยู่
      var location_type = sheet.getRange(i,12).getValue(); //ประเภทสถานที่ขอรับบริการจัดเก็บขยะมูลฝอย
      var service_type = sheet.getRange(i,13).getValue(); //ประเภทขอรับบริการจัดเก็บขยะมูลฝอย
      var quantity = sheet.getRange(i,17).getValue(); //จำนวนถังขยะที่ขอ
      var payment_type = sheet.getRange(i,25).getValue(); //รูปแบบการชำระค่าบริการ
      var email = sheet.getRange(i,2).getValue(); //อีเมล
      var create_date = new Date(sheet.getRange(i,1).getValue()).toLocaleDateString("en-GB"); //วันที่ขอ

      var result = {
        "fulfillmentMessages": [
          {
            "platform": "line",
            "type": 4,
            "payload" : {
            "line":  {
              "type": "flex",
              "altText": "ไม่รองรับการแสดงผลบนอุปกรณ์นี้",
              "contents": {
                "type": "bubble",
                "direction": "ltr",
                "header": {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "text",
                      "text": "รายละเอียด",
                      "weight": "bold",
                      "align": "center",
                      "contents": []
                    }
                  ]
                },
                "body": {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "text",
                      "text": "ชื่อ: " + name,
                      "align": "start",
                      "contents": []
                    },
                    {
                      "type": "text",
                      "text": "ที่อยู่: " + address,
                      "contents": []
                    },
                    {
                      "type": "text",
                      "text": address2,
                      "contents": []
                    },
                    {
                      "type": "text",
                      "text": "สถานที่: " + location_type,
                      "contents": []
                    },
                    {
                      "type": "text",
                      "text": "ประเภท: " + service_type,
                      "contents": []
                    },
                    {
                      "type": "text",
                      "text": "จำนวนถังขยะ: " + quantity,
                      "contents": []
                    },
                    {
                      "type": "text",
                      "text": "รูปแบบการชำระ: " + payment_type,
                      "contents": []
                    },
                    {
                      "type": "text",
                      "text": "อีเมล: " + email,
                      "contents": []
                    },
                    {
                      "type": "text",
                      "text": "วันที่ขอ: " + create_date,
                      "contents": []
                    }
                  ]
                },
                "footer": {
                  "type": "box",
                  "layout": "horizontal",
                  "contents": [
                    {
                      "type": "button",
                      "action": {
                        "type": "message",
                        "label": "ตกลง",
                        "text": "ตกลง"
                      },
                      "style": "primary"
                    }
                  ]
                }
              },
            }
          }
        }
      ]
    }
      var replyJSON = ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
      return replyJSON;
    }
  }
}