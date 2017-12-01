'use strict';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const ConversationV1 = require('watson-developer-cloud/conversation/v1')

const app = express()

let conversation = new ConversationV1({
    username: process.env.WS_CONVERSATION_USERNAME,
    password: process.env.WS_CONVERSATION_PASSWORD,
    version_date: ConversationV1.VERSION_DATE_2017_05_26
});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
    let verify_token = process.env.FB_VERIFY_TOKEN

    let mode = req.query['hub.mode']
    let token = req.query['hub.verify_token']
    let challenge = req.query['hub.challenge']
    
    if (mode && token) {
        if (mode === 'subscribe' && token === verify_token) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);      
        }
    }
})

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
    let body = req.body

    if (body.object === 'page') {
        body.entry.forEach(function(entry) {
            let event = entry.messaging[0]
            let sender = event.sender.id
            
            if (event.message && event.message.text) {
                let text = event.message.text
                let message = text.substring(0, 200)
                
                console.log('Recieved message from ' + sender + ' saying \'' + message  + '\'');

                conversation.message({ 
                    input: { text: message },
                    workspace_id: process.env.WATSON_WORKSPACE_ID
                }, (err, response) => {
                    if (err) {
                        console.error(err);
                    } else {
                        // console.log(JSON.stringify(response, null, 2));
                        let intent = response.intents[0].intent
                        
                        if (intent == "done") {
                            // Call REST API here to save order
                        }

                        sendTextMessage(sender, response.output.text[0])
                    }
                });
            }
        });

        res.sendStatus(200)
    } else {
        res.sendStatus(404)
    }
})

const token = process.env.FB_PAGE_ACCESS_TOKEN

function sendTextMessage(sender, text) {
    let messageData = { text: text }

    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: { access_token: token },
	    method: 'POST',
		json: {
		    recipient: { id: sender },
			message: messageData,
		}
	}, (error, response, body) => {
		if (error) {
		    console.log('Error sending messages: ', error)
		} else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}

app.listen(process.env.PORT || 3000, () => {
    console.log('HydraSeller server is running')
});