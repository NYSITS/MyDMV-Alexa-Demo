/*
  MyDMV Alexa Skill.
  This is the MyDMV Alexa Skill developed for the New York State Department of Motor Vehicles (NYS DMV)
  built with the Amazon Alexa Skills Kit. The Intent Schema, Custom Slots, and Sample Utterances for this skill
  on the NYS ITS GitHub repository located at
  Developed by Nicholas Stucchi
  Developed on July 11, 2017
  Modified on August 14, 2017
*/

'use strict';

var driver = require('./driverQuestions');
var motor = require('./motorQuestions');
var locations = require('./dmv');
var counties = require('./county');

/*
  Route the incoming request based on type (LaunchRequest, IntentRequest,
  etc.) The JSON body of the request is provided in the event parameter.
*/

exports.handler = function(event, context) {
  try {
    console.log("event.session.application.applicationId=" + event.session.application.applicationId);

    /*
      Uncomment this IF STATEMENT and populate it with your skill's application ID
      To prevent someone else from configuring a skill that sends requests to this function.
    */

    if (event.session.application.applicationId !== "amzn1.ask.skill.94246fa0-266e-4fcd-922b-9c85751893e2") {
      context.fail("Invalid Application ID");
    }

    if (event.session.new) {
      onSessionStarted({requestId: event.request.requestId}, event.session);
    }

    if (event.request.type === "LaunchRequest") {
      onLaunch(event.request, event.session, function callback(sessionAttributes, speechletResponse) {
        context.succeed(buildResponse(sessionAttributes, speechletResponse));
      });
    } else if (event.request.type === "IntentRequest") {
      onIntent(event.request, event.session, function callback(sessionAttributes, speechletResponse) {
        context.succeed(buildResponse(sessionAttributes, speechletResponse));
      });
    } else if (event.request.type === "SessionEndedRequest") {
      onSessionEnded(event.request, event.session);
      context.succeed();
    }
  } catch (e) {
    context.fail("Exception: " + e);
  }
};

// Called when the session starts.
function onSessionStarted(sessionStartedRequest, session) {
  console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);
  // Add any session init logic here.
}

// Called when the user invokes the skill without specifying an intent.
function onLaunch(launchRequest, session, callback) {
  console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);
  getWelcomeResponse(callback);
}

// Called when the user specifies an intent for the skill.
function onIntent(intentRequest, session, callback) {
  console.log("onIntent requestId=" + intentRequest.requestId + ", sessionId=" + session.sessionId);

  var intent = intentRequest.intent;
  var intentName = intentRequest.intent.name;

  // Dispatch to custom intents here:
  if ("WhatsNewIntent" === intentName) {
    whatIsNew(intent, session, callback);
  } else if ("AvailableCountiesIntent" === intentName) {
    availableCounties(intent, session, callback);
  } else if ("CountySearchIntent" === intentName) {
    countySearch(intent, session, callback);
  } else if ("DMVAddressIntent" === intentName) {
    dmvAddress(intent, session, callback);
  } else if ("DMVHoursIntent" === intentName) {
    dmvHours(intent, session, callback);
  } else if ("ClosestOfficeIntent" === intentName) {
    closestOffice(intent, session, callback);
  } else if ("QuizSettingsIntent" === intentName) {
    quizSettings(intent, session, callback);
  } else if ("SetGameLengthIntent" === intentName) {
    setGameLength(intent, session, callback);
  } else if ("WhichQuizIntent" === intentName) {
    whichQuiz(intent, session, callback);
  } else if ("DriverQuizIntent" === intentName) {
    handleDriverQuiz(intent, session, callback);
  } else if ("MotorQuizIntent" === intentName) {
    handleMotorQuiz(intent, session, callback);
  } else if ("AMAZON.RepeatIntent" === intentName) {
    handleRepeat(intent, session, callback);
  } else if ("NumberIntent" === intentName) {
    if (session.attributes.previousPlace === "Driver Quiz" || session.attributes.previousPlace === "Driver Answer") {
      handleDriverAnswer(intent, session, callback);
    } else if (session.attributes.previousPlace === "Motor Quiz" || session.attributes.previousPlace === "Motor Answer") {
      handleMotorAnswer(intent, session, callback);
    } else if (session.attributes.previousPlace === "Quiz Settings") {
      setGameLength(intent, session, callback);
    }
  } else if ("DontKnowIntent" === intentName) {
    if (session.attributes.previousPlace === "Driver Quiz" || session.attributes.previousPlace === "Driver Answer") {
      handleDriverAnswer(intent, session, callback);
    } else if (session.attributes.previousPlace === "Motor Quiz" || session.attributes.previousPlace === "Motor Answer") {
      handleMotorAnswer(intent, session, callback);
    } else {
      getHelp(intent, session, callback);
    }
  } else if ("AMAZON.HelpIntent" === intentName) {
    if (session.attributes.previousPlace === "Which Quiz" || session.attributes.previousPlace === "Driver Quiz" || session.attributes.previousPlace === "Driver Answer" || session.attributes.previousPlace === "Motor Quiz" || session.attributes.previousPlace === "Motor Answer") {
      quizHelp(intent, session, callback);
    } else if (session.attributes.previousPlace === "Available Counties" || session.attributes.previousPlace === "What County" || session.attributes.previousPlace === "County Search" || session.attributes.previousPlace === "DMV Address" || session.attributes.previousPlace === "DMV Hours" || session.attributes.previousPlace === "Closest Office") {
      dmvHelp(intent, session, callback);
    } else {
      getHelp(intent, session, callback);
    }
  } else if ("AMAZON.YesIntent" === intentName) {
    if (session.attributes.previousPlace === "Welcome") {
      isFirstTime(intent, session, callback);
    } else if (session.attributes.previousPlace === "Whats New") {
      moreInfo(intent, session, callback);
    } else if (session.attributes.previousPlace === "More Info" || session.attributes.previousPlace === "DMV Address" || session.attributes.previousPlace === "DMV Hours" || session.attributes.previousPlace === "Anything Else") {
      whatElse(intent, session, callback);
    } else if (session.attributes.previousPlace === "Available Counties") {
      availableCounties(intent, session, callback);
    } else if (session.attributes.previousPlace === "Set Game Length" || session.attributes.previousPlace === "Quiz Help") {
      whichQuiz(intent, session, callback);
    } else if (session.attributes.previousPlace === "Closest Office") {
      closestOffice(intent, session, callback);
    } else if (session.attributes.previousPlace === "Driver Answer") {
      handleDriverQuiz(intent, session, callback);
    } else if (session.attributes.previousPlace === "Motor Answer") {
      handleMotorQuiz(intent, session, callback);
    }
  } else if ("AMAZON.NoIntent" === intentName) {
    if (session.attributes.previousPlace === "Welcome") {
      isNotFirstTime(intent, session, callback);
    } else if (session.attributes.previousPlace === "Available Counties") {
      whatCounty(intent, session, callback);
    } else if (session.attributes.previousPlace === "Closest Office") {
      anythingElse(intent, session, callback);
    } else if (session.attributes.previousPlace === "Driver Answer") {
      endSessionFromDriverQuiz(intent, session, callback);
    } else if (session.attributes.previousPlace === "Motor Answer") {
      endSessionFromMotorQuiz(intent, session, callback);
    } else {
      endSession(intent, session, callback);
    }
  } else if ("AMAZON.StopIntent" === intentName) {
    if (session.attributes.previousPlace === "Available Counties") {
      whatCounty(intent, session, callback);
    } else if (session.attributes.previousPlace === "Driver Quiz" || session.attributes.previousPlace === "Driver Answer") {
      endSessionFromDriverQuiz(intent, session, callback);
    } else if (session.attributes.previousPlace === "Motor Quiz" || session.attributes.previousPlace === "Motor Answer") {
      endSessionFromMotorQuiz(intent, session, callback);
    } else {
      endSession(intent, session, callback);
    }
  } else if ("AMAZON.CancelIntent" === intentName) {
    if (session.attributes.previousPlace === "Driver Quiz" || session.attributes.previousPlace === "Driver Answer") {
      endSessionFromDriverQuiz(intent, session, callback);
    } else if (session.attributes.previousPlace === "Motor Quiz" || session.attributes.previousPlace === "Motor Answer") {
      endSessionFromMotorQuiz(intent, session, callback);
    } else {
      endSession(intent, session, callback);
    }
  } else {
    throw "Invalid Intent";
  }
}

// Called when the user ends the session. Is not called when the skill returns shouldEndSession=true.
function onSessionEnded(sessionEndedRequest, session) {
  console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);
  // Add any cleanup logic here.
}

// --------------------------------------- SKILL SPECIFIC BUSINESS LOGIC -------------------------------------------
var GAME_LENGTH = 5;
var ANSWER_COUNT = 4;
var HOME_LAT = 42.652580;
var HOME_LNG = -73.756233;

function quizSettings(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Quiz Settings Menu";
  var speechOutput = "Both driver and motorcycle permit quizzes are set to " + GAME_LENGTH.toString() + " questions by default. You can change the number of questions asked by saying, set game length to, and any number from 2 to 20. If " + GAME_LENGTH.toString() + " questions is enough simply say, start a quiz. What would you like to do? ";
  var repromptText = "Say, set game length to, in order to change the game length from " + GAME_LENGTH.toString() + ". Or say, start a quiz to begin. What would you like to do? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Quiz Settings"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function setGameLength(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Set The Game Length";
  var number = intent.slots.Number.value;
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!number) {
    GAME_LENGTH = 5;
    speechOutput = "I'm sorry, I didn't quite understand what you wanted to change the game length to. It remains set at " + GAME_LENGTH.toString() + ". Please try again. ";
    repromptText = "To try and set the game length again say, set game length to, and any number between 2 and 20. Please try again. ";
  } else {
    GAME_LENGTH = number;
    speechOutput = "The game length is now set to " + GAME_LENGTH.toString() + ". Would you like to start a quiz? ";
    repromptText = "Would you like to start a quiz? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Set Game Length"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getWelcomeResponse(callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Welcome to the MyDMV Alexa Skill";
  var speechOutput = "Welcome to the My DMV Alexa Skill! Is this your first time using this skill? ";
  var repromptText = "Is this your first time using this skill? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Welcome"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function isFirstTime(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "What You Can Do With MyDMV!";
  var speechOutput = "I can tell you about all sorts of information. To hear new information regarding your, Inspections, Registrations, and License Renewals say, what's new. "
  + "I can prepare you for both the written driver and motorcycle permit test by quizzing you. To take a quiz say, quiz me, or start a quiz. "
  + "Or I can provide you with general information about DMV offices, such as where they are located, hours of operation, and the three closest offices to you! "
  + "What would you like to do? ";
  var repromptText = "Would you like new information about, Inspections, Registrations, and License Renewals. General information about DMV offices. Or to take a practice permit quiz? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "First Time"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function isNotFirstTime(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Tell Me What You Want To Do";
  var speechOutput = "Welcome back, what would you like to do? ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Not First Time"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function whatIsNew(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "New Information";
  var speechOutput = "Your inspection for passenger plate, A B C 1 2 3, expired July 1.  "
  + "Your boat registration for, N Y 1 2 3 4 5, will expire on August 1.  "
  + "Your driver's license will expire next month, you are eligible to renew it online.  "
  + "Would you like to learn more about renewing your license online?  ";
  var repromptText = "Would you like to learn more about renewing your license online?  ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Whats New"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function moreInfo(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Online License Renewals";
  var speechOutput = "To renew your license online follow these steps: "
  + "Step 1, pass an eye test by an approved provider, like a pharmacy. Or have a professional complete a paper report. "
  + "Step 2, follow the online renewal steps on the DMV website. "
  + "And, step 3, download and print a temporary license, in PDF format to use until your new license arrives. "
  + "If you would like more in depth information, please visit the DMV website. "
  + "Is there anything else I can help you with today? ";
  var repromptText = "Is there anything else I can help you with today? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "More Info"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function whatElse(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "What Else Can I Do For You?";
  var speechOutput = "What else would you like to know about? I can tell you about new information regarding your, Inspections, Registrations, and License Renewals. "
  + "Or you can find out where a DMV office is located and when it's open. Or you can take a quiz for the written permit test. What would you like to do? ";
  var repromptText = "Would you like new information about, Inspections, Registrations, and License Renewals. General information about DMV offices. Or to take a practice permit quiz? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "What Else"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function anythingElse(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Anything Else I Can Help You With?";
  var speechOutput = "Is there anything else I can help you with today? ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Anything Else"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function availableCounties(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "New York Counties";
  var speechOutput = "You can search for offices within the following counties, if you hear the county you wish to search in say, stop. Counties include: "
  + "Albany, Allegany, Bronx, Broome, Cattaraugus, Cayuga, Chautauqua, Chemung, Chenango, Clinton, "
  + "Columbia, Cortland, Delaware, Dutchess, Erie, Essex, Franklin, Fulton, Genesee, Greene, "
  + "Hamilton, Herkimer, Jefferson, Kings, Lewis, Livingston, Madison, Monroe, Montgomery, "
  + "Nassau, New York, Niagara, Oneida, Onodaga, Ontario, Orange, Orleans, Ostego, Oswego, "
  + "Putnam, Queens, Rensselaer, Richmond, Rockland, Saratoga, Schenectady, Schoharie, Schuyler, "
  + "Seneca, Saint Lawrence, Steuben, Suffolk, Tompkins, Ulster, Warren, Washington, "
  + "Wayne, Westchester, Wyoming, and Yates County. "
  + "Do you need to hear this list again? ";
  var repromptText = "Do you need to hear the County list again? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Available Counties"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function whatCounty(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "What County Do You Want To Search In?";
  var speechOutput = "What county do you want to search for a DMV Office in? ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "What County"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function countySearch(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Search For DMV Offices By County";
  var county = intent.slots.County.value.toLowerCase();
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!counties[county]) {
  speechOutput = "I'm sorry, I didn't understand what County you wanted to know about. Please try again, or ask about another County. ";
  repromptText = "Try asking again, or about another County. ";
  } else {
    var office_list = counties[county].names;
    speechOutput = "The following Offices are located within " + county + ": " + office_list + ". "
    + "If the office you want to know about has been listed say, tell me about, and the name of the office. If not say the county again to hear the list another time. ";
    repromptText = "Say the tell me about, and the office you wish to hear about. Or say the county name again to hear the list another time. ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "County Search"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function dmvAddress(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE;
  var office = intent.slots.Office.value.toLowerCase();
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!locations[office]) {
    speechOutput = "I'm sorry, I didn't understand what DMV Office you wanted to know about. Please try again, or ask about another DMV Office. ";
    repromptText = "Try asking again, or about another office. ";
    CARD_TITLE = "Try asking again, or about another office.";
  } else {
    var office_name = locations[office].office_name;
    var address = locations[office].street_address_line_1;
    var city = locations[office].city;
    var state = locations[office].state;
    var zip = locations[office].zip_code;

    CARD_TITLE = office_name + " DMV Office";
    speechOutput = "The " + office_name + " DMV is located at " + address + ", " + city + ", " + state + " " + zip + ". Is there anything else I can help you with? ";
    repromptText = "Is there anything else I can help you with? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "DMV Address"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function dmvHours(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE;
  var office = intent.slots.Office.value.toLowerCase();
  var speechOutput;
  var repromptText;
  var shouldEndSession = false;

  if (!locations[office]) {
    speechOutput = "I'm sorry, I didn't understand what DMV Office you wanted to know about. Please try again, or ask about another DMV Office. ";
    repromptText = "Try asking again, or about another office. ";
    CARD_TITLE = "Try asking again, or about another office.";
  } else {
    var office_name = locations[office].office_name;
    var mon_hrs = locations[office].mon_hrs;
    var tue_hrs = locations[office].tue_hrs;
    var wed_hrs = locations[office].wed_hrs;
    var thurs_hrs = locations[office].thurs_hrs;
    var fri_hrs = locations[office].fri_hrs;
    var sat_hrs = locations[office].sat_hrs;

    CARD_TITLE = office_name + " DMV Hours Of Operation";
    speechOutput = "The " + office_name + " DMV's hours are as follows. Monday: " + mon_hrs + ". Tuesday: " + tue_hrs + ". Wednesday: " + wed_hrs + ". Thursday: " + thurs_hrs + ". Friday: " + fri_hrs
    + ". Saturday: " + sat_hrs + ". Is there anything else I can help you with? ";
    repromptText = "Is there anything else I can help you with? ";
  }

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "DMV Hours"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getDistance() {
  var calcDistance = [];
  for (var i = 0; i < dmvOffice.length; i++) {
    var office = dmvOffice[i].office_name;
    var dmvLat = dmvOffice[i].latitude;
    var dmvLng = dmvOffice[i].longitude;
    var address = dmvOffice[i].address;

    var deltaLat = Math.abs(dmvLat - HOME_LAT);
    var deltaLng = Math.abs(dmvLng - HOME_LNG);
    var R = 6371000;
    var φ1 = HOME_LAT * (Math.PI / 180);
    var φ2 = dmvLat * (Math.PI / 180);
    var Δφ = deltaLat * (Math.PI / 180);
    var Δλ = deltaLng * (Math.PI / 180);

    var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    var dMiles = (d * 0.000621371192).toFixed(2);

    calcDistance.push({officeName: office, distance: dMiles, location: address});
  }

  return calcDistance;
}

function closestOffice(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "The 3 Closest DMV Offices To You";
  var calculatedDistance = getDistance().sort(function(a, b) {
    return parseFloat(a.distance) - parseFloat(b.distance);
  });
  var speechOutput = "Here are the three closest DMV Offices to you. 1: The " + calculatedDistance[0].officeName + ", which is located at " + calculatedDistance[0].location
  + ". 2: The " + calculatedDistance[1].officeName + ", which is located at " + calculatedDistance[1].location + ". And 3: The " + calculatedDistance[2].officeName + ", which is located at " + calculatedDistance[2].location + ". Do you need to hear this information again? ";
  var repromptText = "Do you need to hear this information again? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Closest Office"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function whichQuiz(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Which Quiz Would You Like To Take?";
  var speechOutput = "Are you preparing for your driver permit, or, motorcycle permit? ";
  var repromptText = speechOutput;
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Which Quiz"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function handleDriverQuiz(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Driver Permit Quiz";
  var speechOutput = "Hello, I will ask you " + GAME_LENGTH.toString() + " questions. Just say the number of the answer you think is correct. Let's start. ";
  var shouldEndSession = false;
  var driverGameQuestions = getDriverQuestions();
  var driverCorrectAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
  var driverRoundAnswers = getDriverAnswers(driverGameQuestions, 0, driverCorrectAnswerIndex);
  var driverCurrentQuestionIndex = 0;
  var driverSpokenQuestion = Object.keys(driver.DRIVER_QUESTIONS[driverGameQuestions[driverCurrentQuestionIndex]])[0];
  var repromptText = "Question 1: " + driverSpokenQuestion + " ";

  for (var i = 0; i < ANSWER_COUNT; i++) {
    repromptText += (i + 1).toString() + ". " + driverRoundAnswers[i] + ". ";
  }

  speechOutput += repromptText;

  sessionAttributes = {
    "speechOutput": repromptText,
    "repromptText": repromptText,
    "driverCurrentQuestionIndex": driverCurrentQuestionIndex,
    "driverCorrectAnswerIndex": driverCorrectAnswerIndex + 1,
    "driverQuestions": driverGameQuestions,
    "driverScore": 0,
    "driverCorrectAnswerText": driver.DRIVER_QUESTIONS[driverGameQuestions[driverCurrentQuestionIndex]][Object.keys(driver.DRIVER_QUESTIONS[driverGameQuestions[driverCurrentQuestionIndex]])[0]][0],
    "previousPlace": "Driver Quiz"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getDriverQuestions() {
  var driverGameQuestions = [];
  var driverIndexList = [];
  var driverIndex = driver.DRIVER_QUESTIONS.length;

  if (GAME_LENGTH > driverIndex) {
    throw "Invalid Game Length";
  }

  for (var i = 0; i < driver.DRIVER_QUESTIONS.length; i++) {
    driverIndexList.push(i);
  }

  // Pick GAME_LENGTH random question from the list to ask the user, make sure there are no repeats.
  for (var j = 0; j < GAME_LENGTH; j++) {
    var driverRand = Math.floor(Math.random() * driverIndex);
    driverIndex -= 1;

    var driverTemp = driverIndexList[driverIndex];
    driverIndexList[driverIndex] = driverIndexList[driverRand];
    driverIndexList[driverRand] = driverTemp;
    driverGameQuestions.push(driverIndexList[driverIndex]);
  }

  return driverGameQuestions;
}

function getDriverAnswers(driverGameQuestionIndexes, driverCorrectAnswerIndex, driverCorrectAnswerTargetLocation) {
  /*
    Get the answer for a given question, and place the correct answer at the spot marked by the
    correctAnswerTargetLocation variable. Note that you can have as many answers as you want but
    only ANSWER_COUNT will be selected.
  */

  var driverAnswers = [];
  var driverAnswersCopy = driver.DRIVER_QUESTIONS[driverGameQuestionIndexes[driverCorrectAnswerIndex]][Object.keys(driver.DRIVER_QUESTIONS[driverGameQuestionIndexes[driverCorrectAnswerIndex]])[0]];
  var driverIndex = driverAnswersCopy.length;
  var driverTemp;

  if (driverIndex < ANSWER_COUNT) {
    throw "Not Enough Answers For Question";
  }

  // Shuffle the answers, excluding the first element.
  for (var j = 1; j < driverAnswersCopy.length; j++) {
    var driverRand = Math.floor(Math.random() * (driverIndex - 1)) + 1;
    driverIndex -= 1;

    driverTemp = driverAnswersCopy[driverIndex];
    driverAnswersCopy[driverIndex] = driverAnswersCopy[driverRand];
    driverAnswersCopy[driverRand] = driverTemp;
  }

  // Swap the correct answer into the target location.
  for (var i = 0; i < ANSWER_COUNT; i++) {
    driverAnswers[i] = driverAnswersCopy[i];
  }

  driverTemp = driverAnswers[0];
  driverAnswers[0] = driverAnswers[driverCorrectAnswerTargetLocation];
  driverAnswers[driverCorrectAnswerTargetLocation] = driverTemp;

  return driverAnswers;
}

function handleDriverAnswer(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Driver Permit Quiz";
  var speechOutput = "";
  var driverAnswerSlotValid = isDriverAnswerSlotValid(intent);
  var userGaveUp = intent.name === "DontKnowIntent";

  if (!driverAnswerSlotValid && !userGaveUp) {
    // If the user provided answer isn't a number > 0 and < ANSWER_COUNT,
    // return an error message to the user. Remember to guide the user into providing correct values.
    var reprompt = session.attributes.speechOutput;
    speechOutput = "I'm sorry I didn't quite understand. Remember your answer must be a number between 1 and " + ANSWER_COUNT.toString() + ". " + reprompt;
    callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, reprompt, false));
  } else {
    var driverGameQuestions = session.attributes.driverQuestions;
    var driverCorrectAnswerIndex = parseInt(session.attributes.driverCorrectAnswerIndex);
    var driverCurrentScore = parseInt(session.attributes.driverScore);
    var driverCurrentQuestionIndex = parseInt(session.attributes.driverCurrentQuestionIndex);
    var driverCorrectAnswerText = session.attributes.driverCorrectAnswerText;
    var speechOutputAnalysis = "";

    if (driverAnswerSlotValid && parseInt(intent.slots.Number.value) === driverCorrectAnswerIndex) {
      driverCurrentScore++;
      speechOutputAnalysis = "correct!  ";
    } else {
      if (!userGaveUp) {
        speechOutputAnalysis = "incorrect!  ";
      }
      speechOutputAnalysis += "The correct answer is " + driverCorrectAnswerIndex + ": " + driverCorrectAnswerText + ". ";
    }

    // if currentQuestionIndex is 4, we've reached 5 questions (zero-indexed) and can ask the user to keep going or stop.
    if (driverCurrentQuestionIndex == GAME_LENGTH - 1) {
      speechOutput = userGaveUp ? "" : "That answer is ";
      speechOutput += speechOutputAnalysis + "You got " + driverCurrentScore.toString() + " out of " + GAME_LENGTH.toString() + " questions correct. Would you like to play another round?  ";
      var resetGameLength = 5;
      GAME_LENGTH = resetGameLength;
      callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "Would you like to play another round?  ", false));
    } else {
      driverCurrentQuestionIndex += 1;
      var driverSpokenQuestion = Object.keys(driver.DRIVER_QUESTIONS[driverGameQuestions[driverCurrentQuestionIndex]])[0];
      driverCorrectAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
      var driverRoundAnswers = getDriverAnswers(driverGameQuestions, driverCurrentQuestionIndex, driverCorrectAnswerIndex);
      var driverQuestionIndexForSpeech = driverCurrentQuestionIndex + 1;
      var repromptText = "Question " + driverQuestionIndexForSpeech.toString() + ". " + driverSpokenQuestion + ". ";

      for (var i = 0; i < ANSWER_COUNT; i++) {
        repromptText += (i + 1).toString() + ". " + driverRoundAnswers[i] + ". ";
      }

      speechOutput += userGaveUp ? "" : "That answer is ";
      speechOutput += speechOutputAnalysis + "Your score is " + driverCurrentScore.toString() + ". " + repromptText;

      sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": repromptText,
        "driverCurrentQuestionIndex": driverCurrentQuestionIndex,
        "driverCorrectAnswerIndex": driverCorrectAnswerIndex + 1,
        "driverQuestions": driverGameQuestions,
        "driverScore": driverCurrentScore,
        "driverCorrectAnswerText": driver.DRIVER_QUESTIONS[driverGameQuestions[driverCurrentQuestionIndex]][Object.keys(driver.DRIVER_QUESTIONS[driverGameQuestions[driverCurrentQuestionIndex]])[0]][0],
        "previousPlace": "Driver Answer"
      };

      callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
    }
  }
}

function handleMotorQuiz(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Motorcycle Permit Quiz";
  var speechOutput = "Hello, I will ask you " + GAME_LENGTH.toString() + " questions. Just say the number of the answer you think is correct. Let's start.  ";
  var shouldEndSession = false;
  var motorGameQuestions = getMotorQuestions();
  var motorCorrectAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
  var motorRoundAnswers = getMotorAnswers(motorGameQuestions, 0, motorCorrectAnswerIndex);
  var motorCurrentQuestionIndex = 0;
  var motorSpokenQuestion = Object.keys(motor.MOTOR_QUESTIONS[motorGameQuestions[motorCurrentQuestionIndex]])[0];
  var repromptText = "Question 1: " + motorSpokenQuestion + " ";

  for (var i = 0; i < ANSWER_COUNT; i++) {
    repromptText += (i + 1).toString() + ". " + motorRoundAnswers[i] + ". ";
  }

  speechOutput += repromptText;

  sessionAttributes = {
    "speechOutput": repromptText,
    "repromptText": repromptText,
    "motorCurrentQuestionIndex": motorCurrentQuestionIndex,
    "motorCorrectAnswerIndex": motorCorrectAnswerIndex + 1,
    "motorQuestions": motorGameQuestions,
    "motorScore": 0,
    "motorCorrectAnswerText": motor.MOTOR_QUESTIONS[motorGameQuestions[motorCurrentQuestionIndex]][Object.keys(motor.MOTOR_QUESTIONS[motorGameQuestions[motorCurrentQuestionIndex]])[0]][0],
    "previousPlace": "Motor Quiz"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function getMotorQuestions() {
  var motorGameQuestions = [];
  var motorIndexList = [];
  var motorIndex = motor.MOTOR_QUESTIONS.length;

  if (GAME_LENGTH > motorIndex) {
    throw "Invalid Game Length";
  }

  for (var i = 0; i < motor.MOTOR_QUESTIONS.length; i++) {
    motorIndexList.push(i);
  }

  // Pick GAME_LENGTH random question from the list to ask the user, make sure there are no repeats.
  for (var j = 0; j < GAME_LENGTH; j++) {
    var motorRand = Math.floor(Math.random() * motorIndex);
    motorIndex -= 1;

    var motorTemp = motorIndexList[motorIndex];
    motorIndexList[motorIndex] = motorIndexList[motorRand];
    motorIndexList[motorRand] = motorTemp;
    motorGameQuestions.push(motorIndexList[motorIndex]);
  }

  return motorGameQuestions;
}

function getMotorAnswers(motorGameQuestionIndexes, motorCorrectAnswerIndex, motorCorrectAnswerTargetLocation) {
  /*
    Get the answer for a given question, and place the correct answer at the spot marked by the
    correctAnswerTargetLocation variable. Note that you can have as many answers as you want but
    only ANSWER_COUNT will be selected.
  */

  var motorAnswers = [];
  var motorAnswersCopy = motor.MOTOR_QUESTIONS[motorGameQuestionIndexes[motorCorrectAnswerIndex]][Object.keys(motor.MOTOR_QUESTIONS[motorGameQuestionIndexes[motorCorrectAnswerIndex]])[0]];
  var motorIndex = motorAnswersCopy.length;
  var motorTemp;

  if (motorIndex < ANSWER_COUNT) {
    throw "Not Enough Answers For Question";
  }

  // Shuffle the answers, excluding the first element.
  for (var j = 1; j < motorAnswersCopy.length; j++) {
    var motorRand = Math.floor(Math.random() * (motorIndex - 1)) + 1;
    motorIndex -= 1;

    motorTemp = motorAnswersCopy[motorIndex];
    motorAnswersCopy[motorIndex] = motorAnswersCopy[motorRand];
    motorAnswersCopy[motorRand] = motorTemp;
  }

  // Swap the correct answer into the target location.
  for (var i = 0; i < ANSWER_COUNT; i++) {
    motorAnswers[i] = motorAnswersCopy[i];
  }

  motorTemp = motorAnswers[0];
  motorAnswers[0] = motorAnswers[motorCorrectAnswerTargetLocation];
  motorAnswers[motorCorrectAnswerTargetLocation] = motorTemp;

  return motorAnswers;
}

function handleMotorAnswer(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "Motorcycle Permit Quiz";
  var speechOutput = "";
  var motorAnswerSlotValid = isMotorAnswerSlotValid(intent);
  var userGaveUp = intent.name === "DontKnowIntent";

  if (!motorAnswerSlotValid && !userGaveUp) {
    // If the user provided answer isn't a number > 0 and < ANSWER_COUNT,
    // return an error message to the user. Remember to guide the user into providing correct values.
    var reprompt = session.attributes.speechOutput;
    speechOutput = "I'm sorry I didn't quite understand. Remember your answer must be a number between 1 and " + ANSWER_COUNT.toString() + ". " + reprompt;
    callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, reprompt, false));
  } else {
    var motorGameQuestions = session.attributes.motorQuestions;
    var motorCorrectAnswerIndex = parseInt(session.attributes.motorCorrectAnswerIndex);
    var motorCurrentScore = parseInt(session.attributes.motorScore);
    var motorCurrentQuestionIndex = parseInt(session.attributes.motorCurrentQuestionIndex);
    var motorCorrectAnswerText = session.attributes.motorCorrectAnswerText;
    var speechOutputAnalysis = "";

    if (motorAnswerSlotValid && parseInt(intent.slots.Number.value) === motorCorrectAnswerIndex) {
      motorCurrentScore++;
      speechOutputAnalysis = "correct!  ";
    } else {
      if (!userGaveUp) {
        speechOutputAnalysis = "incorrect!  ";
      }
      speechOutputAnalysis += "The correct answer is " + motorCorrectAnswerIndex + ": " + motorCorrectAnswerText + ". ";
    }

    // if currentQuestionIndex is 4, we've reached 5 questions (zero-indexed) and can ask the user to keep going or stop.
    if (motorCurrentQuestionIndex == GAME_LENGTH - 1) {
      speechOutput = userGaveUp ? "" : "That answer is ";
      speechOutput += speechOutputAnalysis + "You got " + motorCurrentScore.toString() + " out of " + GAME_LENGTH.toString() + " questions correct. Would you like to play another round?  ";
      var resetGameLength = 5;
      GAME_LENGTH = resetGameLength;
      callback(session.attributes, buildSpeechletResponse(CARD_TITLE, speechOutput, "Would you like to play another round?  ", false));
    } else {
      motorCurrentQuestionIndex += 1;
      var motorSpokenQuestion = Object.keys(motor.MOTOR_QUESTIONS[motorGameQuestions[motorCurrentQuestionIndex]])[0];
      motorCorrectAnswerIndex = Math.floor(Math.random() * (ANSWER_COUNT));
      var motorRoundAnswers = getMotorAnswers(motorGameQuestions, motorCurrentQuestionIndex, motorCorrectAnswerIndex);
      var motorQuestionIndexForSpeech = motorCurrentQuestionIndex + 1;
      var repromptText = "Question " + motorQuestionIndexForSpeech.toString() + ". " + motorSpokenQuestion + ". ";

      for (var i = 0; i < ANSWER_COUNT; i++) {
        repromptText += (i + 1).toString() + ". " + motorRoundAnswers[i] + ". ";
      }

      speechOutput += userGaveUp ? "" : "That answer is ";
      speechOutput += speechOutputAnalysis + "Your score is " + motorCurrentScore.toString() + ". " + repromptText;

      sessionAttributes = {
        "speechOutput": speechOutput,
        "repromptText": repromptText,
        "motorCurrentQuestionIndex": motorCurrentQuestionIndex,
        "motorCorrectAnswerIndex": motorCorrectAnswerIndex + 1,
        "motorQuestions": motorGameQuestions,
        "motorScore": motorCurrentScore,
        "motorCorrectAnswerText": motor.MOTOR_QUESTIONS[motorGameQuestions[motorCurrentQuestionIndex]][Object.keys(motor.MOTOR_QUESTIONS[motorGameQuestions[motorCurrentQuestionIndex]])[0]][0],
        "previousPlace": "Motor Answer"
      };

      callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
    }
  }
}

function handleRepeat(intent, session, callback) {
  /*
    Repeat the previous speechOutput and repromptText from the session attributes if available
    else start a new game session.
  */
  if (!session.attributes || !session.attributes.speechOutput) {
    getWelcomeResponse(callback);
  } else {
    callback(session.attributes, buildSpeechletResponseWithoutCard(session.attributes.speechOutput, session.attributes.repromptText, false));
  }
}

function getHelp(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "General Help";
  var speechOutput = "I can tell you about new information regarding the status of your inspections, registrations, and license renewals. "
  + "Just say, what's new or say, update me, to hear all about this new information! "
  + "I can also tell you about general DMV information such as the address and office hours. And I can tell you the closest three DMV offices to you. "
  + "If you are practicing for the written permit test, I can also help you get ready by quizzing you! "
  + "To start a quiz all you have to say is quiz me, or you can say start a quiz. "
  + "You can also say, stop or cancel to exit. What would you like to do? ";
  var repromptText = "What would you like to do? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Get Help"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function dmvHelp(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "DMV Office Help";
  var speechOutput = "If you don't know which office you are looking for, you can search for offices by county. To hear what counties you can search for say, what are the available counties? "
  + "To search for offices by county you can say, what offices are in, and the county you wish to search in. "
  + "You can ask where a specific office is by saying, where is the Oswego DMV located. Or get the office hours by saying, when is the Oswego DMV open. "
  + "You can also say, what's the closest DMV office to me, and I will tell you the three closest offices to you. Would you like to hear information about DMV offices? ";
  var repromptText = "Would you like to hear information about DMV offices? ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "DMV Help"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function quizHelp(intent, session, callback) {
  var sessionAttributes = {};
  var CARD_TITLE = "MyDMV Permit Quiz Help";
  var speechOutput = "I will get you ready to take the test for both driver and motorcycle permits!  "
  + "The quiz is easy to take, you can say, quiz me and I will ask you which quiz you would like to take.  "
  + "Or you can jump right into it by saying, quiz me for the driver permit. Or by saying, quiz me for the motorcycle permit.  "
  + "Each quiz is set up as " + GAME_LENGTH.toString() + " questions per round, and " + ANSWER_COUNT.toString() + " answers per question.  "
  + "You can change the number of questions asked by saying, set game length to, or change game length to, and any number between 2 and 20. "
  + "Questions are varied by round, and the answers will be in a different spot each time, so make sure to really listen to the question!  "
  + "Once I read through the question and answers, you can answer by saying the number of the answer choice you think is the correct one.  "
  + "For the motorcycle quiz you need to say, the answer is, or my answer is, before the number of the answer you think is correct.  "
  + "For the driver quiz all you have to say is the number of the answer you think is correct, or you can say, i think it's, then the number of the answer you think is correct.  "
  + "And if you need to hear a question again, all you have to say is repeat that, or repeat that question.  "
  + "When the round is over you can say, yes to play another round, or you can say, no, to exit.  "
  + "Would you like to start a quiz now?  ";
  var repromptText = "Do you need me to repeat this information again?  ";
  var shouldEndSession = false;

  sessionAttributes = {
    "speechOutput": speechOutput,
    "repromptText": repromptText,
    "previousPlace": "Quiz Help"
  };

  callback(sessionAttributes, buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, shouldEndSession));
}

function endSession(intent, session, callback) {
  callback(session.attributes, buildSpeechletResponseWithoutCard("Thank you for using the My DMV Alexa Skill. Have a wonderful day!", "", true));
}

function endSessionFromDriverQuiz(intent, session, callback) {
  callback(session.attributes, buildSpeechletResponseWithoutCard("Thank you for using the My DMV Alexa Skill. Good luck on your driver permit test!", "", true));
}

function endSessionFromMotorQuiz(intent, session, callback) {
  callback(session.attributes, buildSpeechletResponseWithoutCard("Thank you for using the My DMV Alexa Skill. Good luck on your motorcycle permit test!", "", true));
}

function isDriverAnswerSlotValid(intent) {
  var driverAnswerSlotFilled = intent.slots && intent.slots.Number && intent.slots.Number.value;
  var driverAnswerSlotIsInt = driverAnswerSlotFilled && !isNaN(parseInt(intent.slots.Number.value));
  return driverAnswerSlotIsInt && parseInt(intent.slots.Number.value) < (ANSWER_COUNT + 1) && parseInt(intent.slots.Number.value) > 0;
}

function isMotorAnswerSlotValid(intent) {
  var motorAnswerSlotFilled = intent.slots && intent.slots.Number && intent.slots.Number.value;
  var motorAnswerSlotIsInt = motorAnswerSlotFilled && !isNaN(parseInt(intent.slots.Number.value));
  return motorAnswerSlotIsInt && parseInt(intent.slots.Number.value) < (ANSWER_COUNT + 1) && parseInt(intent.slots.Number.value) > 0;
}

function isAnswerSlotValid(intent) {
  var answerSlotFilled = intent.slots && intent.slots.Number && intent.slots.Number.value;
  var answerSlotIsInt = answerSlotFilled && !isNaN(parseInt(intent.slots.Number.value));
  return answerSlotIsInt && parseInt(intent.slots.Number.value) < (ANSWER_COUNT + 1) && parseInt(intent.slots.Number.value) > 0;
}

// --------------------------------------- HELPER FUNCTIONS THAT BUILD ALL RESPONSES -------------------------------------------
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
  return {
    outputSpeech: {
      type: "PlainText",
      text: output
    },
    card: {
      type: "Simple",
      title: title,
      content: output
    },
    reprompt: {
      outputSpeech: {
        type: "PlainText",
        text: repromptText
      }
    },
    shouldEndSession: shouldEndSession
  };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
  return {
    outputSpeech: {
      type: "PlainText",
      text: output
    },
    reprompt: {
      outputSpeech: {
        type: "PlainText",
        text: repromptText
      }
    },
    shouldEndSession: shouldEndSession
  };
}

function buildResponse(sessionAttributes, speechletResponse) {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  };
}

var dmvOffice = [
  {
    office_name: "Oswego DMV Office",
    latitude: 43.4318042,
    longitude: -76.4828885,
    address: "384 East River Road, Oswego, NY, 13126"
  },
  {
    office_name: "Niagara Falls DMV Office",
    latitude: 43.098766,
    longitude: -79.049355,
    address: "1001 11th Street, Niagara Falls, NY, 14301"
  },
  {
    office_name: "Belmont DMV Office",
    latitude: 42.224958,
    longitude: -78.033314,
    address: "7 Court Street, Belmont, NY, 14813"
  },
  {
    office_name: "Greece DMV Office",
    latitude: 43.2146633,
    longitude: -77.7250018,
    address: "152 Greece Ridge Center, Rochester, NY, 14626"
  },
  {
    office_name: "Deposit DMV Office",
    latitude: 42.0619508,
    longitude: -75.4208464,
    address: "3 Elm Street, Deposit, NY, 13754"
  },
  {
    office_name: "Brooklyn DMV Office",
    latitude: 40.6838452,
    longitude: -73.9754325,
    address: "625 Atlantic Avenue, Brooklyn, NY, 11217"
  },
  {
    office_name: "Little Valley DMV Office",
    latitude: 42.2520075,
    longitude: -78.8013227,
    address: "303 Court Street, Little Valley, NY, 14755"
  },
  {
    office_name: "Ithaca DMV Office",
    latitude: 42.4471281,
    longitude: -76.5047394,
    address: "301 Third Street, Ithaca, NY, 14850"
  },
  {
    office_name: "Wappingers Falls DMV Office",
    latitude: 41.590977,
    longitude: -73.905422,
    address: "29 Marshall Road, Wappingers Falls, NY, 12590"
  },
  {
    office_name: "Fulton DMV Office",
    latitude: 43.330733,
    longitude: -76.416438,
    address: "200 North Second Street, Fulton, NY, 13069"
  },
  {
    office_name: "Binghamton DMV Office",
    latitude: 42.101498,
    longitude: -75.910182,
    address: "81 Chenango Street, Binghamton, NY, 13901"
  },
  {
    office_name: "Williamsville DMV Office",
    latitude: 42.972952,
    longitude: -78.693062,
    address: "6205 Main Street, Williamsville, NY, 14221"
  },
  {
    office_name: "Schoharie DMV Office",
    latitude: 42.663509,
    longitude: -74.312761,
    address: "284 Main Street, Schoharie, NY, 12157"
  },
  {
    office_name: "Elmira DMV Office",
    latitude: 42.077915,
    longitude: -76.801595,
    address: "425-477 Pennsylvania Avenue, Elmira, NY, 14904"
  },
  {
    office_name: "Brewster DMV Office",
    latitude: 41.428313,
    longitude: -73.626621,
    address: "1 Geneva Road, Brewster, NY, 10509"
  },
  {
    office_name: "Newburgh DMV Office",
    latitude: 41.500575,
    longitude: -74.012463,
    address: "128 Broadway, Newburgh, NY, 12550"
  },
  {
    office_name: "Millbrook DMV Office",
    latitude: 41.786177,
    longitude: -73.695255,
    address: "15 Merritt Avenue, Millbrook, NY, 12545"
  },
  {
    office_name: "Gouverneur DMV Office",
    latitude: 44.32465,
    longitude: -75.481562,
    address: "1227 U.S. Highway 11, Gouverneur, NY, 13642"
  },
  {
    office_name: "Endicott DMV Office",
    latitude: 42.101329,
    longitude: -76.048428,
    address: "124-132 Washington Avenue, Endicott, NY, 13760"
  },
  {
    office_name: "Huntington DMV Office",
    latitude: 40.858357,
    longitude: -73.41845,
    address: "813 New York Avenue, Huntington, NY, 11743"
  },
  {
    office_name: "Cheektoaga DMV Office",
    latitude: 42.919785,
    longitude: -78.734883,
    address: "2122 George Urban Boulevard, Depew, NY, 14043"
  },
  {
    office_name: "North Syracuse DMV Office",
    latitude: 43.126406,
    longitude: -76.115814,
    address: "5801 East Taft Road, North Syracuse, NY, 13212"
  },
  {
    office_name: "Orchard Park DMV Office",
    latitude: 42.772771,
    longitude: -78.798198,
    address: "4041 Southwestern Boulevard, Orchard Park, NY, 14224"
  },
  {
    office_name: "Penn Yan DMV Office",
    latitude: 42.664332,
    longitude: -77.058343,
    address: "417 Liberty Street, Penn Yan, NY, 14527"
  },
  {
    office_name: "Old Forge DMV Office",
    latitude: 43.708734,
    longitude: -74.973902,
    address: "183 Park Avenue, Old Forge, NY, 13420"
  },
  {
    office_name: "Amherst DMV Office",
    latitude: 42.980445,
    longitude: -78.819265,
    address: "3094-A Sheridan Drive, Amherst, NY, 14226"
  },
  {
    office_name: "Pulaski DMV Office",
    latitude: 43.565976,
    longitude: -76.128839,
    address: "2 Broad Street, Pulaski, NY, 13142"
  },
  {
    office_name: "Hauppauge DMV Office",
    latitude: 40.820719,
    longitude: -73.219216,
    address: "250 Veterans Memorial Highway, Hauppauge, NY, 11788"
  },
  {
    office_name: "Lowville DMV Office",
    latitude: 43.76784,
    longitude: -75.464877,
    address: "7049 State Route 12, Lowville, NY, 13367"
  },
  {
    office_name: "Dansville DMV Office",
    latitude: 42.559448,
    longitude: -77.695642,
    address: "14 Clara Barton Street, Dansville, NY, 14437"
  },
  {
    office_name: "Jamaica DMV Office",
    latitude: 40.707399,
    longitude: -73.791969,
    address: "168-46 91st Avenue, Jamaica, NY, 11432"
  },
  {
    office_name: "Fort Edward DMV Office",
    latitude: 43.286531,
    longitude: -73.586605,
    address: "383 Broadway, Fort Edward, NY, 12828"
  },
  {
    office_name: "Olean DMV Office",
    latitude: 42.086296,
    longitude: -78.450261,
    address: "1 Leo Moss Drive, Olean, NY, 14760"
  },
  {
    office_name: "Medford DMV Office",
    latitude: 40.824892,
    longitude: -72.993627,
    address: "2799 Route 112, Medford, NY, 11763"
  },
  {
    office_name: "Harlem DMV Office",
    latitude: 40.804276,
    longitude: -73.936584,
    address: "159 East 125th Street, New York, NY, 10035"
  },
  {
    office_name: "Delevan DMV Office",
    latitude: 42.495305,
    longitude: -78.475275,
    address: "1006 North Main Street, Delevan, NY, 14042"
  },
  {
    office_name: "Lower Manhattan DMV Office",
    latitude: 40.705272,
    longitude: -74.014622,
    address: "11 Greenwich Street, New York, NY, 10004"
  },
  {
    office_name: "Herkimer DMV Office",
    latitude: 43.028545,
    longitude: -74.988403,
    address: "109 Mary Street, Herkimer, NY, 13350"
  },
  {
    office_name: "Poughkeepsie DMV Office",
    latitude: 41.703598,
    longitude: -73.929524,
    address: "22 Market Street, Poughkeepsie, NY, 12601"
  },
  {
    office_name: "Lake George DMV Office",
    latitude: 43.35951,
    longitude: -73.699597,
    address: "1340 State Route 9, Lake George, NY, 12845"
  },
  {
    office_name: "Springfield Gardens DMV Office",
    latitude: 40.658878,
    longitude: -73.771499,
    address: "168-35 Rockaway Boulevard, Jamaica, NY, 11434"
  },
  {
    office_name: "Coney Island DMV Office",
    latitude: 40.577894,
    longitude: -73.975507,
    address: "2875 West 8th Street, Brooklyn, NY, 11224"
  },
  {
    office_name: "Clifton Park DMV Office",
    latitude: 42.909431,
    longitude: -73.798869,
    address: "22 Clifton Country Center, Clifton Park, NY, 12068"
  },
  {
    office_name: "Geneva DMV Office",
    latitude: 42.86678,
    longitude: -76.984084,
    address: "83 Seneca Street, Geneva, NY, 14456"
  },
  {
    office_name: "Schenectady DMV Office",
    latitude: 42.814501,
    longitude: -73.944475,
    address: "267 State Street, Schenectady, NY, 12305"
  },
  {
    office_name: "Cooperstown DMV Office",
    latitude: 42.701178,
    longitude: -74.929926,
    address: "197 Main Street, Cooperstown, NY, 13326"
  },
  {
    office_name: "Rome DMV Office",
    latitude: 43.212738,
    longitude: -75.462004,
    address: "301 West Dominick Street, Rome, NY, 13440"
  },
  {
    office_name: "License Express DMV Office",
    latitude: 40.748342,
    longitude: -73.991552,
    address: "145 West 30th Street, New York, NY, 10001"
  },
  {
    office_name: "Canandaigua DMV Office",
    latitude: 42.889187,
    longitude: -77.280217,
    address: "20 Ontario Street, Canandaigua, NY, 14424"
  },
  {
    office_name: "Bronx DMV Office",
    latitude: 40.837321,
    longitude: -73.840317,
    address: "1350 Commerce Avenue, Bronx, NY, 10461"
  },
  {
    office_name: "Massapequa DMV Office",
    latitude: 40.700927,
    longitude: -73.431011,
    address: "927 Carmans Road, Massapequa, NY, 11758"
  },
  {
    office_name: "Lockport DMV Office",
    latitude: 43.170694,
    longitude: -78.689603,
    address: "111 Main Street, Lockport, NY, 14095"
  },
  {
    office_name: "Midtown Manhattan DMV Office",
    latitude: 40.751565,
    longitude: -73.997043,
    address: "366 West 31st Street, New York, NY, 10001"
  },
  {
    office_name: "Norwich DMV Office",
    latitude: 42.531935,
    longitude: -75.525911,
    address: "5 Court Street, Norwich, NY, 13815"
  },
  {
    office_name: "Sidney DMV Office",
    latitude: 42.317241,
    longitude: -75.390465,
    address: "21 Liberty Street, Sidney, NY, 13838"
  },
  {
    office_name: "Johnstown DMV Office",
    latitude: 43.006828,
    longitude: -74.374997,
    address: "223 West Main Street, Johnstown, NY, 12095"
  },
  {
    office_name: "Elizabethtown DMV Office",
    latitude: 44.215217,
    longitude: -73.594261,
    address: "7559 Court Street, Elizabethtown, NY, 12932"
  },
  {
    office_name: "Wampsville DMV Office",
    latitude: 43.080902,
    longitude: -75.707461,
    address: "138 North Court Street, Wampsville, NY, 13163"
  },
  {
    office_name: "Peekskill DMV Office",
    latitude: 41.290641,
    longitude: -73.91812,
    address: "1045 Park Street, Peekskill, NY, 10566"
  },
  {
    office_name: "North Tonawanda DMV Office",
    latitude: 43.038583,
    longitude: -78.866291,
    address: "500 Wheatfield Street, North Tonawanda, NY, 14120"
  },
  {
    office_name: "Garden City DMV Office",
    latitude: 40.740027,
    longitude: -73.607477,
    address: "801 Axinn Avenue, Garden City, NY, 11530"
  },
  {
    office_name: "Wilton DMV Office",
    latitude: 43.101312,
    longitude: -73.739171,
    address: "3065 Route 50, Saratoga Springs, NY, 12866"
  },
  {
    office_name: "Middletown DMV Office",
    latitude: 41.445764,
    longitude: -74.420569,
    address: "12 King Street, Middletown, NY, 10940"
  },
  {
    office_name: "Buffalo DMV Office",
    latitude: 42.884589,
    longitude: -78.875957,
    address: "170 Pearl Street, Buffalo, NY, 14203"
  },
  {
    office_name: "Margaretville DMV Office",
    latitude: 42.148522,
    longitude: -74.648651,
    address: "733 Main Street, Margaretville, NY, 12455"
  },
  {
    office_name: "Albion DMV Office",
    latitude: 43.238145,
    longitude: -78.214506,
    address: "14016 Route 31 West, Albion, NY, 14411"
  },
  {
    office_name: "Waterloo DMV Office",
    latitude: 42.908274,
    longitude: -76.843666,
    address: "1 Di Pronio Drive, Waterloo, NY, 13165"
  },
  {
    office_name: "Albany DMV Office",
    latitude: 42.6422697,
    longitude: -73.7545938,
    address: "224-260 South Pearl Street, Albany, NY, 12202"
  },
  {
    office_name: "Mayville DMV Office",
    latitude: 42.254474,
    longitude: -79.505236,
    address: "7 North Erie Street, Mayville, NY, 14757"
  },
  {
    office_name: "Dunkirk DMV Office",
    latitude: 42.457629,
    longitude: -79.330387,
    address: "3988 Vineyard Drive, Dunkirk, NY, 14048"
  },
  {
    office_name: "Bath DMV Office",
    latitude: 42.333042,
    longitude: -77.316247,
    address: "3 East Pulteney Square, Bath, NY, 14810"
  },
  {
    office_name: "Riverhead DMV Office",
    latitude: 40.936502,
    longitude: -72.651411,
    address: "200 Old Country Road, Riverhead, NY, 11901"
  },
  {
    office_name: "Plattsburgh DMV Office",
    latitude: 44.699316,
    longitude: -73.453611,
    address: "137 Margaret Street, Plattsburgh, NY, 12901"
  },
  {
    office_name: "Cortland DMV Office",
    latitude: 42.599261,
    longitude: -76.160802,
    address: "112 River Street, Cortland, NY, 13045"
  },
  {
    office_name: "Massena DMV Office",
    latitude: 44.922173,
    longitude: -74.892206,
    address: "21 Harrowgate Commons, Massena, NY, 13662"
  },
  {
    office_name: "Delhi DMV Office",
    latitude: 42.277946,
    longitude: -74.916678,
    address: "1 Court House Square, Delhi, NY, 13753"
  },
  {
    office_name: "Ticonderoga DMV Office",
    latitude: 43.848127,
    longitude: -73.422036,
    address: "132 Montcalm Street, Ticonderoga, NY, 12883"
  },
  {
    office_name: "Malone DMV Office",
    latitude: 44.849339,
    longitude: -74.295329,
    address: "355 West Main Street, Malone, NY, 12953"
  },
  {
    office_name: "Hudson DMV Office",
    latitude: 42.248167,
    longitude: -73.784596,
    address: "560 Warren Street, Hudson, NY, 12534"
  },
  {
    office_name: "Lake Pleasant DMV Office",
    latitude: 43.471998,
    longitude: -74.40286,
    address: "Route 8, Lake Pleasant, NY, 12108"
  },
  {
    office_name: "Auburn DMV Office",
    latitude: 42.929729,
    longitude: -76.569901,
    address: "160 Genesee Street, Auburn, NY, 13021"
  },
  {
    office_name: "Geneseo DMV Office",
    latitude: 42.802202,
    longitude: -77.816212,
    address: "6 Court Street, Geneseo, NY, 14454"
  },
  {
    office_name: "Flushing DMV Office",
    latitude: 40.769937,
    longitude: -73.836601,
    address: "30-56 Whitestone Expressway, Flushing, NY, 11354"
  },
  {
    office_name: "Ballston Spa DMV Office",
    latitude: 42.998908,
    longitude: -73.850503,
    address: "40 McMaster Street, Ballston Spa, NY, 12020"
  },
  {
    office_name: "Utica DMV Office",
    latitude: 43.103926,
    longitude: -75.223885,
    address: "321 Main Street, Utica, NY, 13501"
  },
  {
    office_name: "Ogdensburg DMV Office",
    latitude: 44.697518,
    longitude: -75.493973,
    address: "206-210 Ford Street, Ogdensburg, NY, 13669"
  },
  {
    office_name: "Syracuse DMV Office",
    latitude: 43.032502,
    longitude: -76.193477,
    address: "4671 Onodaga Boulevard, Syracuse, NY, 13219"
  },
  {
    office_name: "White Plains DMV Office",
    latitude: 41.034022,
    longitude: -73.769782,
    address: "200 Hamilton Avenue, White, Plains, NY, 10601"
  },
  {
    office_name: "Hornell DMV Office",
    latitude: 42.327363,
    longitude: -77.662725,
    address: "12 Allen Street, Hornell, NY, 14843"
  },
  {
    office_name: "Fonda DMV Office",
    latitude: 42.957231,
    longitude: -74.380258,
    address: "64 Broadway, Fonda, NY, 12068"
  },
  {
    office_name: "Pawling DMV Office",
    latitude: 41.561895,
    longitude: -73.601388,
    address: "20 East Main Street, Pawling, NY, 12564"
  },
  {
    office_name: "Beacon DMV Office",
    latitude: 41.506693,
    longitude: -73.973895,
    address: "223 Main Street, Beacon, NY, 12508"
  },{
    office_name: "Watkins Glen DMV Office",
    latitude: 42.377227,
    longitude: -76.871585,
    address: "105 9th Street, Watkins, Glen, NY, 14891"
  },
  {
    office_name: "Watertown DMV Office",
    latitude: 43.975194,
    longitude: -75.913959,
    address: "175 Arsenal Street, Watertown, NY, 13601"
  },
  {
    office_name: "Oneonta DMV Office",
    latitude: 42.454799,
    longitude: -75.060242,
    address: "16 South Main Street, Oneonta, NY, 13820"
  },
  {
    office_name: "Warsaw DMV Office",
    latitude: 42.74075,
    longitude: -78.134498,
    address: "6 Perry Avenue, Warsaw, NY, 14569"
  },
  {
    office_name: "Corning DMV Office",
    latitude: 42.14161,
    longitude: -77.055684,
    address: "10 West First Street, Corning, NY, 14830"
  },
  {
    office_name: "Canton DMV Office",
    latitude: 44.601774,
    longitude: -75.149204,
    address: "80 State Highway 310, Canton, NY, 13617"
  },
  {
    office_name: "Angola DMV Office",
    latitude: 42.655677,
    longitude: -79.03626,
    address: "8787 Erie Road, Angola, NY, 14006"
  },
  {
    office_name: "Saranac Lake DMV Office",
    latitude: 44.325567,
    longitude: -74.132326,
    address: "39 Main Street, Saranac Lake, NY, 12983"
  },
  {
    office_name: "Kingston DMV Office",
    latitude: 41.932704,
    longitude: -74.017723,
    address: "244 Fair Street, Kingston, NY, 12401"
  },
  {
    office_name: "Port Jefferson DMV Office",
    latitude: 40.923549,
    longitude: -73.044022,
    address: "1055 Route 112, Port Jefferson, NY, 11776"
  },
  {
    office_name: "Lyons DMV Office",
    latitude: 43.062833,
    longitude: -76.993358,
    address: "9 Pearl Street, Lyons, NY, 14489"
  },
  {
    office_name: "Catskill DMV Office",
    latitude: 42.21999,
    longitude: -73.866403,
    address: "411 Main Street, Catskill, NY, 12414"
  },
  {
    office_name: "Bethpage DMV Office",
    latitude: 40.725931,
    longitude: -73.486672,
    address: "4031 Hempstead Turnpike, Bethpage, NY, 11714"
  },
  {
    office_name: "West Haverstraw DMV Office",
    latitude: 41.20526,
    longitude: -73.985496,
    address: "50 Samsondale Plaza, West Haverstraw, NY, 10993"
  },
  {
    office_name: "Jamestown DMV Office",
    latitude: 42.095585,
    longitude: -79.24794,
    address: "512 West 3rd Street, Jamestown, NY, 14701"
  },
  {
    office_name: "Batavia DMV Office",
    latitude: 42.998605,
    longitude: -78.187941,
    address: "15 Main Street, Batavia, NY, 14020"
  },
  {
    office_name: "Port Jervis DMV Office",
    latitude: 41.374542,
    longitude: -74.690982,
    address: "20 Hammond Street, Port Jervis, NY, 12773"
  }
];
