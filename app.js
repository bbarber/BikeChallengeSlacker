var express = require('express');
var cheerio = require('cheerio');
var request = require('request');
var app = express();


app.head('/', function(req, res) {

    var url = 'https://nationalbikechallenge.org/workplace/4511';
    request(url, function(error, response, html) {
        if (!error) {

            var $ = cheerio.load(html);

            var names = $('.-user .-name .title').map(function(i, a) {
                return a.children[0].data;
            });

            var maxLength = 0;
            for (var i = 0; i < names.length; i++) {
                if (names[i].length > maxLength)
                    maxLength = names[i].length;
            }

            // Pad names so scores right align
            names = names.map(function(i, a) {
                return a + Array(maxLength - a.length + 1).join(' ');
            });

            var scores = $('.-leader-table-desktop .points-bar>span').map(function(i, a) {
                return a.children[0].data;
            });

            var arr = scores.map(function(i, score) {
                return names[i] + ' - ' + score;
            });

            var list = [];
            for (var i = 0; i < arr.length; i++) {
                list.push(arr[i])
            }

            var body = list.join('\r\n');

            var params = '?token=' + process.env.token + '&channel=%23' + process.env.channel;
            var options = {
                url: 'https://dontpaniclabs.slack.com/services/hooks/slackbot' + params,
                body: "```" + body + "```"
            };

            request.post(options);

            res.send('<pre>' + body + '</pre>');
        }
    })
})

app.listen(process.env.PORT || 3000)
