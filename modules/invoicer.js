/**
* @Author: Benjamin Grelié <synoptase>
* @Date:   03-06-2016
* @Email:  benjamin@printicapp.com
* @Last modified by:   benjamin
* @Last modified time: 04-06-2016
*/

var sheets = require("google-spreadsheets");
var google = require('googleapis');
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

    _ready = true;
  }
  catch(err){
    //something went wrong
    throw new Error('Google api init failed! ' + err);
  }

  return {
      getSpreadsheet: function(){
        sheets({ key: sheet_key, auth: authClient },
          (err, spreadsheet) => {
            if (err) { return }
          }
        )
      }
  };
};
module.exports = Invoicer;
