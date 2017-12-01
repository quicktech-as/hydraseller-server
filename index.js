'use strict';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const bodyParser = require('body-parser')

const app = express().use(bodyParser.json())

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
    let body = req.body

    // Checks this is an event from a page subscription
    if (body.object === 'page') {
        body.entry.forEach(function(entry) {
            let webhookEvent = entry.messaging[0]
            console.log(webhookEvent)
        });

        res.status(200).send('EVENT_RECEIVED')
    } else {
        res.sendStatus(404)
    }
})

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
    let mode = req.query['hub.mode']
    let token = req.query['hub.verify_token']
    let challenge = req.query['hub.challenge']
    
    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);      
        }
    }
})

app.listen(process.env.PORT || 3000, function () {
    console.log('HydraSeller server is running')
});