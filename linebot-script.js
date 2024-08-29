function doPost(e) {
  var ssId = "Your-GoogleSheet-ID";
  var ss = SpreadsheetApp.openByUrl("Your*GoogleSheet-URL");

  var sheet = ss.getSheetByName("Messages");
  var lastRow = sheet.getLastRow() + 1;

  //use BetterLog
  Logger = BetterLog.useSpreadsheet(ssId);

  var requestJSON = e.postData.contents;
  Logger.log(requestJSON);

  const arrmonth = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const d = new Date();
  let month = arrmonth[d.getMonth()];
  let year = d.getFullYear();

  var sheet2 = ss.getSheetByName("Counts");
  var row = sheet2.getLastRow();
  var lastRow2 = sheet2.getLastRow()+1;
  
  var currentMonth = sheet2.getRange(row,1).getValue();
  var currentYear = sheet2.getRange(row,2).getValue();
  var currentCount = sheet2.getRange(row,3).getValue();

  //Logger.log("count "+ currentCount);
  //Logger.log("check "+ currentMonth +" "+ month +" "+ currentYear +" "+ year);
  
  var message = JSON.parse(requestJSON).queryResult.queryText;
  var intent = JSON.parse(requestJSON).queryResult.intent.displayName;
  var reply = JSON.parse(requestJSON).queryResult.fulfillmentText;
  var recipient = JSON.parse(requestJSON).originalDetectIntentRequest.payload.data.source.userId;
  var msg = "";

    if(currentMonth == month && currentYear == year){
      if(currentCount == "500"){
        msg = "ข้อความตอบกลับจากแชทบอท ... ครบจำนวน 500 ข้อความแล้วค่ะ";
      }else if(message == "ติดต่อสอบถาม"){
        msg = "มีการสอบถามเพิ่มเติมจากแชทบอท ... ค่ะ";
      }else{
        msg = "มีคำถามจากแชทบอท ... ค่ะ";
      }
      sheet2.getRange(row,3).setValue(parseInt(currentCount)+1);
    }else{
      sheet2.getRange(lastRow2,1).setValue(month);
      sheet2.getRange(lastRow2,2).setValue(year);
      sheet2.getRange(lastRow2,3).setValue(1);
    }

  if (message == "ติดต่อสอบถาม" || intent == "ไม่พบข้อมูล" || currentCount == "500"){
    var token = "Your-Token-ID-Generate-form-LINE-Notify";
    var url = "https://notify-api.line.me/api/notify";
    
    var options = {
      "method": "post",
      "headers": {
        "Authorization": "Bearer " + token
      },
      "payload": {
        "message": msg
      }
    };
    
    UrlFetchApp.fetch(url, options);
  }

  sheet.getRange(lastRow,1).setValue(message);
  sheet.getRange(lastRow,2).setValue(intent);
  sheet.getRange(lastRow,3).setValue(reply);
  sheet.getRange(lastRow,4).setValue(recipient);
}