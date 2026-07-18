require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    Events,
    REST,
    Routes,
    SlashCommandBuilder
} = require("discord.js");

const lineup = require("./lineup");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

const commands = [
    new SlashCommandBuilder()
        .setName("lineup")
        .setDescription("Create a PK lineup")
].map(command => command.toJSON());

async function registerCommands() {
    try {
        const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log("✅ Slash command registered!");
    } catch (err) {
        console.error(err);
    }
}

client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}`);

    await registerCommands();
});

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === "lineup") {
            await lineup.createLineup(interaction);
        }

        return;
    }

    if (interaction.isButton()) {
        await lineup.handleButton(interaction);
        return;
    }

if (interaction.isStringSelectMenu()) {
    try {
        await lineup.handleMenu(interaction);
    } catch (err) {
        console.error("MENU ERROR:");
        console.error(err);
    }
    return;
}

});

client.login(process.env.TOKEN);