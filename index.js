const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');

const panelBot = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let slots = {};
const SLOTS_FILE = './slots.json';

if (fs.existsSync(SLOTS_FILE)) {
  slots = JSON.parse(fs.readFileSync(SLOTS_FILE));
}

function saveSlots() {
  fs.writeFileSync(SLOTS_FILE, JSON.stringify(slots, null, 2));
}

class AdSlot {
  constructor(slotId, token, channels, delay, message) {
    this.slotId = slotId;
    this.token = token;
    this.channels = channels;
    this.delay = Math.max(30, delay);
    this.message = message;
    this.client = null;
    this.interval = null;
  }

  async start() {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
    });

    this.client.once('ready', () => {
      console.log(`[Slot ${this.slotId}] ✅ Logged in as ${this.client.user.tag}`);
      this.startAdvertising();
    });

    try {
      await this.client.login(this.token);
    } catch (e) {
      console.error(`[Slot ${this.slotId}] ❌ Login Failed:`, e.message);
    }
  }

  startAdvertising() {
    this.interval = setInterval(async () => {
      for (const cid of this.channels) {
        try {
          const channel = await this.client.channels.fetch(cid);
          if (channel) {
            await channel.send(this.message);
            console.log(`[Slot ${this.slotId}] ✅ Sent to ${cid}`);
          }
        } catch (e) {
          console.error(`[Slot ${this.slotId}] Send error:`, e.message);
        }
      }
    }, this.delay * 1000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    if (this.client) this.client.destroy();
  }
}

panelBot.on('ready', () => {
  console.log(`Panel Bot Online: ${panelBot.user.tag}`);
});

panelBot.on('interactionCreate', async interaction => {
  if (!interaction.isCommand() && !interaction.isButton() && !interaction.isModalSubmit()) return;

  if (interaction.commandName === 'panel') {
    const embed = new EmbedBuilder()
      .setTitle('🔧 REPLICA CONTROL PANEL')
      .setDescription("Replica's Auto ADV")
      .setColor(0x7289DA);

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('slot1').setLabel('Slot 1').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('addslot').setLabel('+ Add Slot').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('deleteslot').setLabel('Delete Slot').setStyle(ButtonStyle.Danger)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('start').setLabel('Start').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('stop').setLabel('Stop').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('setup').setLabel('Setup').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row1, row2] });
  }

  // Button Handlers
  if (interaction.isButton()) {
    if (interaction.customId === 'setup') {
      const modal = new ModalBuilder().setCustomId('setup_modal').setTitle('Setup Slot 1');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('token').setLabel('Alt Token').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('channels').setLabel('Channel IDs').setStyle(TextInputStyle.Short).setPlaceholder('1471484118930952399').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('delay').setLabel('Delay (Sec)').setStyle(TextInputStyle.Short).setValue('30').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('message').setLabel('Ad Message').setStyle(TextInputStyle.Paragraph).setRequired(true))
      );
      await interaction.showModal(modal);
    }

    if (interaction.customId === 'start') {
      if (!slots['1'] || !slots['1'].token) return interaction.reply({ content: '❌ Setup Slot 1 first!', ephemeral: true });
      const data = slots['1'];
      const slot = new AdSlot('1', data.token, data.channels, data.delay, data.message);
      await interaction.reply({ content: '🚀 Starting Advertising...', ephemeral: true });
      slot.start();
    }

    if (interaction.customId === 'stop') {
      await interaction.reply({ content: '⛔ Stopped (basic version)', ephemeral: true });
    }
  }

  if (interaction.isModalSubmit() && interaction.customId === 'setup_modal') {
    slots['1'] = {
      token: interaction.fields.getTextInputValue('token'),
      channels: interaction.fields.getTextInputValue('channels').split(',').map(c => c.trim()),
      delay: parseInt(interaction.fields.getTextInputValue('delay')),
      message: interaction.fields.getTextInputValue('message')
    };
    saveSlots();
    await interaction.reply({ content: '✅ Slot 1 Saved! Click Start', ephemeral: true });
  }
});

panelBot.login(process.env.DISCORD_TOKEN);
