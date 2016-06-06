/**
* @Author: Benjamin Grelié <synoptase>
* @Date:   03-06-2016
* @Email:  benjamin@printicapp.com
* @Last modified by:   benjamin
* @Last modified time: 06-06-2016
*/

var google = require('googleapis');
var moment = require('moment');
var debug  = require('debug')('invoicer');

var Invoicer = function(config){
  var _ready = false;

  try {

    const sheet_key  = config.invoicer_sheet_key;
    const key        = require( config.invoicer_credentials_file );
    const authClient = new google.auth.JWT(
      key.client_email, null,
      key.private_key, ['https://www.googleapis.com/auth/drive'],
      null
    );

    _ready = true
  }
  catch(err) {
    //something went wrong
    throw new Error('Google api init failed! ' + err);
  }

  Array.prototype.toInvoice = function () {
    var columns = [ "team", "label", "invoice_date", "amount", "capex", "recurring", "created_at" ]
    var r = this.reduce(function(result, field, index) {
      result[columns[index]] = field;
      return result
    }, {})
    return r
  };

  function getLastRow(myRange) {
    var lastRow = myRange.length
    for (; myRange[lastRow - 1] == "" || myRange[lastRow - 1] == 0 && lastRow > 0 ; lastRow--)  {
       /*nothing to do*/
    }

    return myRange[lastRow - 1]
  }

  function getLastRowNumber(myRange) {
    var lastRow = myRange.length
    for (; myRange[lastRow - 1] == "" || myRange[lastRow - 1] == 0 && lastRow > 0 ; lastRow--)  {
       /*nothing to do*/
    }

    return lastRow
  }

  function getSheet(callback) {
    var sheets = google.sheets('v4');
    sheets.spreadsheets.values.get({
      auth: authClient,
      spreadsheetId: sheet_key,
      range: 'Data!A1:G',
    }, function(err, response) {
      if (err) {
        debug('The API returned an error: ' + err);
        return;
      }
      callback(response)
    })
  }

  function readLastRow(callback) {
    getSheet(function(response) {
      lastRow = getLastRow(response.values)
      debug(lastRow)
      callback(lastRow.toInvoice())
    })
  }

  function writeRow(message, callback) {
    getSheet(function(response) {
      lastRowNumber = getLastRowNumber(response.values) + 1
      data = message.text.split('invoice ').pop().split(',').map(Function.prototype.call, String.prototype.trim)
      data.push(moment().unix())
      var sheets = google.sheets('v4');
      sheets.spreadsheets.values.update({
        auth:             authClient,
        spreadsheetId:    sheet_key,
        range:            'Data!A' + lastRowNumber + ':G' + lastRowNumber,
        valueInputOption: 'USER_ENTERED',
        resource:         { values: [data] }
      }, function(err, response) {
        if (err) {
          debug('The API returned an error: ' + err);
          return;
        }
        callback()
      })
    })
  }

  return {
      inputInvoice: function(message, callback) {
        writeRow(message, callback)
      },

      lastInvoice: function(callback) {
        readLastRow(callback)
      }
  };
};
module.exports = Invoicer;
