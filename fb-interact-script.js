function doPost(e) {
  var ssId = "Your Sheets ID";
  var ss = SpreadsheetApp.openByUrl("Your Sheets URL");

  var sheet = ss.getSheetByName("datas");
  var lastRow = sheet.getLastRow() + 1;

  //use BetterLog
  Logger = BetterLog.useSpreadsheet(ssId);

  var requestJSON = e.postData.contents;
  //Logger.log(requestJSON);

  var message = JSON.parse(requestJSON).queryResult.queryText;
  var intent = JSON.parse(requestJSON).queryResult.intent.displayName;
  var reply = JSON.parse(requestJSON).queryResult.fulfillmentText;
  var source = JSON.parse(requestJSON).originalDetectIntentRequest.source;
  var sender = JSON.parse(requestJSON).originalDetectIntentRequest.payload.data.sender.id;
  var recipient = JSON.parse(requestJSON).originalDetectIntentRequest.payload.data.recipient.id;
  const datetime = new Date();

  sheet.getRange(lastRow,1).setValue(message);
  sheet.getRange(lastRow,2).setValue(intent);
  sheet.getRange(lastRow,3).setValue(reply);
  sheet.getRange(lastRow,4).setValue(sender);
  sheet.getRange(lastRow,5).setValue(recipient);
  sheet.getRange(lastRow,6).setValue(source);
  sheet.getRange(lastRow,7).setValue(datetime);
}