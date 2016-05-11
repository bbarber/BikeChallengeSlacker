var express = require('express');
var aws = require('aws-sdk');
var cheerio = require('cheerio');
var request = require('request');
var app = express();

var AWS_ACCESS_KEY_ID = process.env.s3_key;
var AWS_SECRET_ACCESS_KEY = process.env.s3_secret;

app.get('/', function (req, res) {
    
    console.log("request /");
    
    var url = 'https://nationalbikechallenge.org/workplace/4511';
    request(url, function (error, response, html) {
        if (!error) {
            
            console.log("success on request");
            var $ = cheerio.load(html);
            
            var names = $('.-user .-name .title').map(function (i, a) {
                return a.children[0].data;
            });

            var maxLength = 0;
            for (var i = 0; i < names.length; i++) {
                if (names[i].length > maxLength)
                    maxLength = names[i].length;
            }

            // Pad names so scores right align
            names = names.map(function (i, a) {
                return a + Array(maxLength - a.length + 1).join(' ');
            });

            var scores = $('.points-bar>span').map(function (i, a) {
                return a.children[0].data;
            });

            var arr = scores.map(function (i, score) {
                return names[i] + ' - ' + score;
            });

            var list = [];
            for (var i = 0; i < arr.length; i++) {
                list.push(arr[i])
            }

            var body = list.join('\r\n');

            console.log("parsed body");
            
            var s3 = new aws.S3({ params: { Bucket: process.env.s3_bucket, Key: 'nbc.txt' } });

            s3.getObject({
                Bucket: process.env.s3_bucket,
                Key: 'nbc.txt',
                ResponseContentType: 'text/plain'
            }, function (err, data) {
                
                console.log("success s3 read");
                
                // We get back a byte[] from s3, convert to string
                var buf = new Buffer(data.Body.length);
                for (var i = 0; i < data.Body.length; i++) {
                    buf[i] = data.Body[i];
                }heroku 
                var last = buf.toString('utf8');

                console.log("beofre upload");

                if (last !== body) {
                    s3.upload({ Body: body, ACL: 'public-read', ContentType: 'text/plain' }, function () {
                        if (err) {
                            return console.log(err);
                        }
                        
                        console.log("success upload s3");
                        
                        var params = '?token=' + process.env.token + '&channel=%23' + process.env.channel;
                        var options = {
                            url: 'https://dontpaniclabs.slack.com/services/hooks/slackbot' + params,
                            body: "```" + body + "```"
                        };
                        
                        console.log("Before slack post");
                        request.post(options);
                    });
                }
                
                res.send('<pre>' + body + '</pre>');
            });
        }
    })
})

app.listen(process.env.PORT || 3000)
