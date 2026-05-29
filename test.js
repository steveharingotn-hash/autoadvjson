const { Client, GatewayIntentBits } = require('discord.js');

const token = "PASTE_YOUR_NEW_TOKEN_HERE";   // ← Replace with your token

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
  console.log(`✅ SUCCESS! Logged in as ${client.user.tag}`);
  console.log("This means your token is valid.");
});

client.on('error', (e) => {
  console.log("❌ Error:", e.message);
});

client.login(token).catch(err => {
  console.log("❌ Login Failed:", err.message);
});