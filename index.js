/**
* @Author: Benjamin Grelié <benjamin>
* @Date:   31-05-2016
* @Email:  benjamin@printicapp.com
* @Last modified by:   benjamin
* @Last modified time: 06-06-2016
*/

var config   = require('./config/vars')
var Botkit   = require('botkit')
var Invoicer = require('./modules/invoicer')
var moment = require('moment')
var debug    = require('debug')('botkit')
var token    = process.env.SLACK_TOKEN
var controller = Botkit.slackbot({
  // reconnect to Slack RTM when connection goes bad
  retry: Infinity,
  debug: false
})

// Assume single team mode if we have a SLACK_TOKEN
if (token) {
  debug('Starting in single-team mode')
  controller.spawn({
    token: token
  }).startRTM(function (err, bot, payload) {
    if (err) {
      throw new Error(err)
    }

    debug('Connected to Slack RTM')
  })
// Otherwise assume multi-team mode - setup beep boop resourcer connection
} else {
  debug('Starting in Beep Boop multi-team mode')
  require('beepboop-botkit').start(controller, { debug: true })
}

controller.hears('last invoice', ['direct_message'], function (bot, message) {
  var iv = new Invoicer(config)
  iv.lastInvoice(function(invoice) {
    var attachments = [];
    var attachment = {
      ts: invoice.created_at,
      title: invoice.label,
      color: 'good',
      fields: []
    }
    attachment.fields.push({title: 'Date',         value: invoice.invoice_date,       short: true });
    attachment.fields.push({title: 'Amount',       value: invoice.amount + '€', short: true });
    attachment.fields.push({title: 'Capex',        value: invoice.capex,       short: true });
    attachment.fields.push({title: 'Recurring',    value: invoice.recurring,       short: true });
    attachments.push(attachment);
    bot.reply(message, { attachments: attachments })
  })
})

controller.hears('invoice', ['direct_message'], function (bot, message) {
  var iv = new Invoicer(config)
  var sp = iv.inputInvoice(message, function() {
    bot.reply(message, 'Invoice saved!')
  })
})

controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, "I'm here!")
})

controller.hears(['hello', 'hi'], ['direct_mention'], function (bot, message) {
  bot.reply(message, 'Hello.')
})

controller.hears(['hello', 'hi'], ['direct_message'], function (bot, message) {
  bot.reply(message, 'Hello.')
  bot.reply(message, 'It\'s nice to talk to you directly.')
})

controller.hears('.*', ['mention'], function (bot, message) {
  bot.reply(message, 'You really do care about me. :heart:')
})

controller.hears('help', ['direct_message', 'direct_mention'], function (bot, message) {
  var help = 'I will respond to the following messages: \n' +
      '`bot hi` for a simple message.\n' +
      '`bot attachment` to see a Slack attachment message.\n' +
      '`@<your bot\'s name>` to demonstrate detecting a mention.\n' +
      '`bot help` to see this again.'
  bot.reply(message, help)
})

controller.hears(['attachment'], ['direct_message', 'direct_mention'], function (bot, message) {
  var text = 'Beep Beep Boop is a ridiculously simple hosting platform for your Slackbots.'
  var attachments = [{
    fallback: text,
    pretext: 'We bring bots to life. :sunglasses: :thumbsup:',
    title: 'Host, deploy and share your bot in seconds.',
    image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
    title_link: 'https://beepboophq.com/',
    text: text,
    color: '#7CD197'
  }]

  bot.reply(message, {
    attachments: attachments
  }, function (err, resp) {
    console.log(err, resp)
  })
})

controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
  bot.reply(message, 'Sorry <@' + message.user + '>, I don\'t understand. \n')
})
