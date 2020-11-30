import { BOT } from './../../src/bot/index';
import * as functions from 'firebase-functions';

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

const bot = BOT;
void bot.launch();

exports.bot = functions.https.onRequest(async (req, res) => {
	await bot.handleUpdate(req.body, res);
});