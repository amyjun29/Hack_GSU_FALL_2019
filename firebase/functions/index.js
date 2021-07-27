// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 

 
 const timeZone = 'America/Los_Angeles';
 const timeZoneOffset = '-07:00';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const firebase = require('firebase');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const {
dialogflow,
Permission
} = require('actions-on-google');
 
const app = dialogflow();

firebase.initializeApp({
    apiKey: "",
    authDomain: "hackgsu-2019.firebaseapp.com",
    databaseURL: "ws://hackgsu-2019.firebaseio.com",
    projectId: "hackgsu-2019",
    storageBucket: "hackgsu-2019.appspot.com",
    messagingSenderId: "287855843054",
    appId: "1:287855843054:web:06516ac27cc5093ad985ff"
});
  
  
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'ws://hackgsu-2019.firebaseio.com/'
});

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
 

 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  
  function hosteventHandler(agent) {
    
    const eventName = agent.parameters.EventName;
    const location = agent.parameters.Location;
    const time = agent.parameters.Time;
    const date = agent.parameters.Date.slice(0,10);
    const conf = agent.parameters.confirmation;
    
    return admin.database().ref('/EventInfo').push({
      EventName: eventName,
      Location: location.city,
      Time: time, 
      Date: date
    
      
    });
   
   
  }
 

 function volunteereventHandler(agent){
   
  let userlocation = agent.parameters.Location.city;
     
  return admin.database().ref('EventInfo/').orderByChild('Location').equalTo(userlocation).once("value").then((snapshot) => {
    snapshot.forEach((data) => {
         
        const date = data.child("Date").val().slice(0,10);
        const userdate  = agent.parameters.Date.slice(0,10);
      	if(data !== null && data !== undefined && date.localeCompare(userdate) == 0){
      		agent.add(`There is ` + data.child("EventName").val() + ` at ` + data.child("Time").val() + ` on ` + (data.child("Date").val()).slice(0,10) );
        }
              });
  });
    
  }

  function launcheventHandler(agent){
                                                                
  }
  
  function makeAppointment (agent) {
     // Calculate appointment start and end datetimes (end = +1hr from start)
     //console.log("Parameters", agent.parameters.date);
     const dateTimeStart = new Date(Date.parse(agent.parameters.date.split('T')[0] + 'T' + agent.parameters.time.split('T')[1].split('-')[0] + timeZoneOffset));
     const dateTimeEnd = new Date(new Date(dateTimeStart).setHours(dateTimeStart.getHours() + 1));
     const appointmentTimeString = dateTimeStart.toLocaleString(
       'en-US',
       { month: 'long', day: 'numeric', hour: 'numeric', timeZone: timeZone }
     );
  }

 
  let intentMap = new Map();
  intentMap.set('Invocation Intent', launcheventHandler);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Event-host Intent', hosteventHandler);
  intentMap.set('Event-host Intent - yes', hosteventHandler);
  intentMap.set('Event-volunteer Intent', volunteereventHandler);
  intentMap.set('Schedule Appointment', makeAppointment);
  agent.handleRequest(intentMap);

});

