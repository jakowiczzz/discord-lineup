const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    PermissionsBitField
} = require("discord.js");

const ROLES = [
    "DB",
    "CC",
    "Mage",
    "Attacker 1",
    "Attacker 2",
    "Attacker 3",
    "Attacker 4",
    "Attacker 5"
];

const EMOJIS = {
    DB: "<:healer1:1527729042969727159>",
    CC: "<:healer1:1527729042969727159>",
    Mage: "<:mage1:1527729074976325733>",
    Attacker: "<:warrior1:1527729117909356564>"
};

let lineup = {};
let lineupMessage = null;

function resetLineup() {

    lineup = {};

    for (const role of ROLES) {
        lineup[role] = null;
    }

}

resetLineup();

function getPlayerCount() {

    return Object.values(lineup).filter(Boolean).length;

}

function getEmoji(role) {

    if (role.startsWith("Attacker")) {
        return EMOJIS.Attacker;
    }

    return EMOJIS[role];

}

function buildEmbed() {

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setTitle("⚔ PK Lineup");

    let description = `**Players:** ${getPlayerCount()}/8\n\n`;

    for (const role of ROLES) {

    const player = lineup[role]
        ? `<@${lineup[role]}>`
        : "`Empty`";

    description += `${getEmoji(role)} **${role}**\u2003\u2003${player}\n\n`;

}

    embed.setDescription(description);

    return embed;

}

function buildButtons() {

    const full = getPlayerCount() >= ROLES.length;

    return [
        new ActionRowBuilder().addComponents(

            new ButtonBuilder()
                .setCustomId("join")
                .setLabel("Join")
                .setStyle(ButtonStyle.Success)
                .setDisabled(full),

            new ButtonBuilder()
                .setCustomId("leave")
                .setLabel("Leave")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("reset")
                .setLabel("Reset")
                .setStyle(ButtonStyle.Danger)

        )
    ];

}async function updateLineupMessage() {

    if (!lineupMessage) return;

    await lineupMessage.edit({
        embeds: [buildEmbed()],
        components: buildButtons()
    });

}

async function createLineup(interaction) {

    resetLineup();

    await interaction.reply({
        embeds: [buildEmbed()],
        components: buildButtons()
    });

    lineupMessage = await interaction.fetchReply();

}

async function handleButton(interaction) {

    if (interaction.customId === "join") {

        // Already in lineup?
        for (const role of ROLES) {

            if (lineup[role] === interaction.user.id) {

                return interaction.reply({
                    content: "❌ You are already in the lineup.",
                    ephemeral: true
                });

            }

        }

        const options = [];

        for (const role of ROLES) {

            if (lineup[role] === null) {

                options.push({
                    label: role,
                    value: role
                });

            }

        }

        if (!options.length) {

            return interaction.reply({
                content: "The lineup is already full.",
                ephemeral: true
            });

        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId("role_select")
            .setPlaceholder("Choose your role")
            .addOptions(options);

        return interaction.reply({
            content: "Select your role:",
            components: [
                new ActionRowBuilder().addComponents(menu)
            ],
            ephemeral: true
        });

    }

    if (interaction.customId === "leave") {

        let removed = false;

        for (const role of ROLES) {

            if (lineup[role] === interaction.user.id) {

                lineup[role] = null;
                removed = true;
                break;

            }

        }

        if (!removed) {

            return interaction.reply({
                content: "❌ You are not in the lineup.",
                ephemeral: true
            });

        }

        await updateLineupMessage();

        return interaction.reply({
            content: "✅ You left the lineup.",
            ephemeral: true
        });

    }    if (interaction.customId === "reset") {

        const allowed =
            interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
            interaction.member.roles.cache.some(role => role.name === "Nieuwe Rol");

        if (!allowed) {

            return interaction.reply({
                content: "❌ You don't have permission to reset the lineup.",
                ephemeral: true
            });

        }

        resetLineup();

        await updateLineupMessage();

        return interaction.reply({
            content: "✅ Lineup reset.",
            ephemeral: true
        });

    }

}

async function handleMenu(interaction) {

    if (interaction.customId !== "role_select") return;

    const chosenRole = interaction.values[0];

    // Already in lineup?
    for (const role of ROLES) {

        if (lineup[role] === interaction.user.id) {

            return interaction.update({
                content: "❌ You are already in the lineup.",
                components: []
            });

        }

    }

    // Role taken while menu was open?
    if (lineup[chosenRole] !== null) {

        return interaction.update({
            content: "❌ That role has already been taken.",
            components: []
        });

    }

    lineup[chosenRole] = interaction.user.id;

    await updateLineupMessage();

    return interaction.update({
        content: `✅ You joined as **${chosenRole}**.`,
        components: []
    });

}

module.exports = {
    createLineup,
    handleButton,
    handleMenu
};