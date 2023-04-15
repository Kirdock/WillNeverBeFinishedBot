import type { ChatCommand, InteractionExecuteResponse } from '../../../../interfaces/command';
import {
    getInteractionMetadata,
    getLangComponent,
    getLangSlashCommandBuilder,
    getSoundSelection
} from '../../../utils/commonCommand.utils';
import { CommandLangKey } from '../../types/lang.types';
import type {
    ChatInputCommandInteraction,
    InteractionReplyOptions,
    MessageActionRowComponentBuilder
} from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionsBitField } from 'discord.js';
import { getCommandLangKey, getDefaultCommandLang } from '../../commandLang';
import { databaseHelper } from '../../../../services/databaseHelper';
import { InteractionError } from '../../../../utils/InteractionError';
import type { IServerSettings } from '../../../../../../shared/interfaces/server-settings';
import type { PickByType } from '../../../../../../shared/models/types';
import { chunkArray } from '../../../../utils/array.utils';
import { MESSAGE_COMPONENTS_MAX_BUTTONS_PER_ROW, MESSAGE_COMPONENTS_MAX_ROWS } from '../../../constants';

const introGroupName = getDefaultCommandLang(CommandLangKey.SETTINGS_INTRO_NAME);
const checkSubCommand = getDefaultCommandLang(CommandLangKey.SETTINGS_CHECKS_NAME);
const introSetName = getDefaultCommandLang(CommandLangKey.SETTINGS_INTRO_SET_NAME);
const outroSetName = getDefaultCommandLang(CommandLangKey.SETTINGS_OUTRO_SET_NAME);
const { soundOption, soundCommandName, autocomplete } = getSoundSelection(true, false);

const command: ChatCommand = {
    data: getLangSlashCommandBuilder(CommandLangKey.SETTINGS_NAME, CommandLangKey.SETTINGS_DESCRIPTION)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommandGroup((group) =>
            getLangComponent(group, CommandLangKey.SETTINGS_INTRO_NAME, CommandLangKey.SETTINGS_INTRO_DESCRIPTION)
                .addSubcommand((subCommand) =>
                    getLangComponent(subCommand, CommandLangKey.SETTINGS_INTRO_SET_NAME, CommandLangKey.SETTINGS_INTRO_SET_DESCRIPTION)
                        .addStringOption(soundOption)
                ).addSubcommand((subCommand) =>
                    getLangComponent(subCommand, CommandLangKey.SETTINGS_INTRO_REMOVE_NAME, CommandLangKey.SETTINGS_INTRO_REMOVE_DESCRIPTION)
                )
        )
        .addSubcommandGroup((group) =>
            getLangComponent(group, CommandLangKey.SETTINGS_OUTRO_NAME, CommandLangKey.SETTINGS_OUTRO_DESCRIPTION)
                .addSubcommand((subCommand) =>
                    getLangComponent(subCommand, CommandLangKey.SETTINGS_OUTRO_SET_NAME, CommandLangKey.SETTINGS_OUTRO_SET_DESCRIPTION)
                        .addStringOption(soundOption)
                ).addSubcommand((subCommand) =>
                    getLangComponent(subCommand, CommandLangKey.SETTINGS_OUTRO_REMOVE_NAME, CommandLangKey.SETTINGS_OUTRO_REMOVE_DESCRIPTION)
                )
        )
        .addSubcommand((group) =>
            getLangComponent(group, CommandLangKey.SETTINGS_CHECKS_NAME, CommandLangKey.SETTINGS_CHECKS_DESCRIPTION)
        ).toJSON(),
    async execute(interaction) {
        const group = interaction.options.getSubcommandGroup(false);
        const subCommand = interaction.options.getSubcommand(false);

        if (!group && subCommand === checkSubCommand) {
            return executeCheck(interaction);
        }

        const method = group === introGroupName ? executeIntro : executeOutro;
        const result = await method(interaction);

        if (result) {
            return result;
        }
        return getCommandLangKey(interaction, CommandLangKey.SUCCESS);
    },
    autocomplete,
};

async function executeCheck(interaction: ChatInputCommandInteraction): InteractionExecuteResponse {
    const { guildId } = getInteractionMetadata(interaction);
    const serverSettings = await databaseHelper.getServerSettings(guildId);
    const options = getBoolean(serverSettings);
    const actionRows = getBooleanActionRows(options);
    const introAudioFile = serverSettings.defaultIntro ? await databaseHelper.getSoundMeta(serverSettings.defaultIntro) : undefined;
    const outroAudioFile = serverSettings.defaultOutro ? await databaseHelper.getSoundMeta(serverSettings.defaultOutro) : undefined;
    const messageContent: InteractionReplyOptions = {
        content: `
**Intro:** ${introAudioFile?.fileName ?? 'none'}
**Outro:** ${outroAudioFile?.fileName ?? 'none'}`,
        components: actionRows,
        ephemeral: true,
    };

    const reply = await interaction.reply(messageContent);
    const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_000 });


    collector.on('collect', async (button) => {
        try {
            const settingsKey = button.customId as keyof PickByType<IServerSettings, boolean>;
            const isEnabled = button.component.style === ButtonStyle.Success;
            const newValue = !isEnabled;

            await databaseHelper.updateServerSetting(guildId, { [settingsKey]: newValue });

            options[settingsKey] = newValue;
            messageContent.components = getBooleanActionRows(options);

            await reply.edit(messageContent);
            button.update({});
        } catch {
            button.reply({
                content: 'Unknown error',
                ephemeral: true,
            });
        }
    });
}

function getBooleanActionRows(options: Record<string, boolean>): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
    const buttons = generateBooleanButtons(options);
    const actionRowButtons = chunkArray(buttons, MESSAGE_COMPONENTS_MAX_BUTTONS_PER_ROW).slice(0, MESSAGE_COMPONENTS_MAX_ROWS); // ignore the fact for now that there can be more than 25 buttons
    return actionRowButtons.map((buttons) => new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(...buttons));
}

function getBoolean(settings: IServerSettings): PickByType<IServerSettings, boolean> {
    return {
        minUser: settings.minUser,
        playIntro: settings.playIntro,
        playOutro: settings.playOutro,
        recordVoice: settings.recordVoice,
        playIntroWhenUnmuted: settings.playIntroWhenUnmuted,
        leaveChannelAfterPlay: settings.leaveChannelAfterPlay
    };
}

function generateBooleanButtons(settings: Record<string, boolean>): ButtonBuilder[] {
    return Object.keys(settings).map<ButtonBuilder>((key) => new ButtonBuilder().setLabel(key).setCustomId(key).setStyle(settings[key] ? ButtonStyle.Success : ButtonStyle.Danger));
}

async function executeIntro(interaction: ChatInputCommandInteraction): InteractionExecuteResponse {
    const subCommand= interaction.options.getSubcommand(true);

    if (subCommand === introSetName) {
        return executeIntroSet(interaction);
    }
    return  executeIntroDelete(interaction);
}

async function executeIntroSet(interaction: ChatInputCommandInteraction): InteractionExecuteResponse {
    const { guildId } = getInteractionMetadata(interaction);
    const intro = interaction.options.getString(soundCommandName, true);
    const audioFile = await databaseHelper.getSoundMetaByName(intro, guildId);
    if (!audioFile) {
        throw new InteractionError(interaction, CommandLangKey.ERRORS_FILE_NOT_FOUND);
    }
    await databaseHelper.updateServerIntro(guildId, audioFile._id.toHexString());
}

async function executeIntroDelete(interaction: ChatInputCommandInteraction): InteractionExecuteResponse {
    const { guildId } = getInteractionMetadata(interaction);
    await databaseHelper.updateServerIntro(guildId, undefined);
}

async function executeOutro(interaction: ChatInputCommandInteraction): InteractionExecuteResponse {
    const subCommand= interaction.options.getSubcommand(true);
    if (subCommand === outroSetName) {
        return executeOutroSet(interaction);
    }
    return executeOutroDelete(interaction);
}

async function executeOutroSet(interaction: ChatInputCommandInteraction): InteractionExecuteResponse {
    const { guildId } = getInteractionMetadata(interaction);
    const outro = interaction.options.getString(soundCommandName, true);
    const audioFile = await databaseHelper.getSoundMetaByName(outro, guildId);
    if (!audioFile) {
        throw new InteractionError(interaction, CommandLangKey.ERRORS_FILE_NOT_FOUND);
    }
    await databaseHelper.updateServerOutro(guildId, audioFile._id.toHexString());
}

async function executeOutroDelete(interaction: ChatInputCommandInteraction): InteractionExecuteResponse {
    const { guildId } = getInteractionMetadata(interaction);
    await databaseHelper.updateServerOutro(guildId, undefined);
}


export default command;
