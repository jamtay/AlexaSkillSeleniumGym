/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');

const GetNewFactHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'GetNewGymIntent');
  },
  async handle(handlerInput) {

    const peoplez = await getPeople()
    const speechOutput = GET_GYM_NUMBER_MESSAGE_START + peoplez + GET_GYM_NUMBER_MESSAGE_ENDING;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard(SKILL_NAME, peoplez)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, an error occurred.')
      .reprompt('Sorry, an error occurred.')
      .getResponse();
  },
};

const SKILL_NAME = 'Gym count';
const GET_GYM_NUMBER_MESSAGE_START = 'There\'s ';
const GET_GYM_NUMBER_MESSAGE_ENDING = ' in the gym right now';
const HELP_MESSAGE = 'This is a help message.  I don\'t know what it does... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with? You Idiot!';
const STOP_MESSAGE = 'Goodbye!';

const getPeople = async () => {
  var webdriver = require('selenium-webdriver');
  var chrome = require('selenium-webdriver/chrome');
  const {By, Key, until} = require('selenium-webdriver');
  var builder = new webdriver.Builder().forBrowser('chrome');
  var chromeOptions = new chrome.Options();
  const defaultChromeFlags = [
      '--headless',
      '--disable-gpu',
      '--window-size=1280x1696', // Letter size
      '--no-sandbox',
      '--user-data-dir=/tmp/user-data',
      '--hide-scrollbars',
      '--enable-logging',
      '--log-level=0',
      '--v=99',
      '--single-process',
      '--data-path=/tmp/data-path',
      '--ignore-certificate-errors',
      '--homedir=/tmp',
      '--disk-cache-dir=/tmp/cache-dir'
  ];

  chromeOptions.setChromeBinaryPath("/var/task/lib/chrome");
  chromeOptions.addArguments(defaultChromeFlags);
  builder.setChromeOptions(chromeOptions);

  var driver = builder.build();
  await driver.get('https://www.puregym.com/Login/?ReturnUrl=%2Fmembers%2F');
  const title = await driver.getTitle()
  var pinEl = await driver.findElement(By.id(`pin`));
  await driver.wait(until.elementIsVisible(pinEl),100);
  await pinEl.sendKeys(process.env.GYM_PIN);

  var emailEl = await driver.findElement(By.id(`email`));
  await driver.wait(until.elementIsVisible(emailEl),100);
  await emailEl.sendKeys(process.env.GYM_EMAIL);

  let buttonEl = await driver.findElement(By.id(`login-submit`));
  await driver.wait(until.elementIsVisible(buttonEl),100);
  await buttonEl.click();

  await driver.wait(until.elementLocated(By.className(`heading--level3`)), 100000);
  let heading = await driver.findElement(By.className(`heading--level3`));
  await driver.wait(until.elementIsVisible(heading),100);

  const textPeople = await heading.getText();

  await driver.quit();
  return textPeople
}

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    GetNewFactHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
