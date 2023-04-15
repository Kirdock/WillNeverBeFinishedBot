import type { ChatCommand, InteractionExecuteResponse } from '../../../../interfaces/command';
import {
    getChannelOption,
    getInteractionMetadata,
    getLangComponent,
    getLangSlashCommandBuilder,
    getSoundSelection
} from '../../../utils/commonCommand.utils';
import { CommandLangKey } from '../../types/lang.types';
import type {
    ChatInputCommandInteraction,
    InteractionReplyOptions,
    MessageActionRowComponentBuilder,
    MessageComponentInteraction
} from 'discord.js';
import {
    ActionRowBuilder,
    bold,
    ButtonBuilder,
    ButtonStyle,
    channelMention,
    ChannelType,
    ComponentType,
    PermissionsBitField
} from 'discord.js';
import { getCommandLangKey, getDefaultCommandLang } from '../../commandLang';
import { databaseHelper } from '../../../../services/databaseHelper';
import { InteractionError } from '../../../../utils/InteractionError';
import type { IServerSettings } from '../../../../../../shared/interfaces/server-settings';
import type { PickByType } from '../../../../../../shared/models/types';
import { chunkArray } from '../../../../utils/array.utils';
import { MESSAGE_COMPONENTS_MAX_BUTTONS_PER_ROW, MESSAGE_COMPONENTS_MAX_ROWS } from '../../../constants';
import { scopedLogger } from '../../../../services/logHelper';


const logger = scopedLogger('APPLICATION_COMMANDS');
const baseComponentInteractionTimeout = 3_600_000; // 1 hour

const introGroupName = getDefaultCommandLang(CommandLangKey.SETTINGS_INTRO_NAME);
const outroGroupName = getDefaultCommandLang(CommandLangKey.SETTINGS_OUTRO_NAME);
const logVoiceGroupName = getDefaultCommandLang(CommandLangKey.SETTINGS_LOG_VOICE_NAME);
const checkSubCommand = getDefaultCommandLang(CommandLangKey.SETTINGS_CHECKS_NAME);
const introSetName = getDefaultCommandLang(CommandLangKey.SETTINGS_INTRO_SET_NAME);
const outroSetName = getDefaultCommandLang(CommandLangKey.SETTINGS_OUTRO_SET_NAME);
const logVoiceSetName = getDefaultCommandLang(CommandLangKey.SETTINGS_LOG_VOICE_SET_NAME);
const { soundOption, soundCommandName, autocomplete } = getSoundSelection(true, false);
const { channelOption, channelCommandName } = getChannelOption(true);

const subCommandExecutes: Record<string, ChatCommand['execute']> = {
    [introGroupName]: executeIntro,
    [outroGroupName]: executeOutro,
    [logVoiceGroupName]: executeLogVoice,
};

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
        .addSubcommandGroup((group) =>
            getLangComponent(group, CommandLangKey.SETTINGS_LOG_VOICE_NAME, CommandLangKey.SETTINGS_LOG_VOICE_DESCRIPTION)
                .addSubcommand((subCommand) =>
                    getLangComponent(subCommand, CommandLangKey.SETTINGS_LOG_VOICE_SET_NAME, CommandLangKey.SETTINGS_LOG_VOICE_SET_DESCRIPTION)
                        .addChannelOption(channelOption)
                ).addSubcommand((subCommand) =>
                    getLangComponent(subCommand, CommandLangKey.SETTINGS_LOG_VOICE_REMOVE_NAME, CommandLangKey.SETTINGS_LOG_VOICE_REMOVE_DESCRIPTION)
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

        const method = group ? subCommandExecutes[group] : undefined;
        const result = await method?.(interaction);

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
${bold('Intro:')} ${introAudioFile?.fileName ?? 'none'}
${bold('Outro:')} ${outroAudioFile?.fileName ?? 'none'}
${bold('Voice state logs channel:')} ${serverSettings.logVoiceStateChannel ? channelMention(serverSettings.logVoiceStateChannel) : 'none'}`,
        components: actionRows,
        ephemeral: true,
    };

    const reply = await interaction.reply(messageContent);
    const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: baseComponentInteractionTimeout });


    collector.on('collect', async (buttonInteraction) => {
        try {
            const settingsKey = buttonInteraction.customId as keyof PickByType<IServerSettings, boolean>;
            const isEnabled = buttonInteraction.component.style === ButtonStyle.Success;
            const isEnabledNew = !isEnabled;
            const newActionRows = updateComponent<ButtonBuilder>(buttonInteraction, (button) => button.setStyle(isEnabledNew ? ButtonStyle.Success : ButtonStyle.Danger));

            await databaseHelper.updateServerSetting(guildId, { [settingsKey]: isEnabledNew });

            await reply.edit({
                content: buttonInteraction.message.content,
                components: newActionRows,
            });
            buttonInteraction.update({});
        } catch (e) {
            logger.error(e, 'server settings button interaction');
            buttonInteraction.reply({
                content:  getCommandLangKey(buttonInteraction, CommandLangKey.ERRORS_UNKNOWN),
                ephemeral: true,
            });
        }
    });

    collector.on('end', async () => {
        await reply.delete();
    });
}

function updateComponent<T extends MessageActionRowComponentBuilder>(interaction: MessageComponentInteraction, newButtonFunc: (component: T) => T, customId = interaction.customId): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
    const indices = findComponent(interaction, customId);
    if (!indices) {
        return [];
    }

    const actionRows = interaction.message.components.map<ActionRowBuilder<MessageActionRowComponentBuilder>>((row) => ActionRowBuilder.from(row));
    newButtonFunc(actionRows[indices.actionRowIndex].components[indices.componentIndex] as T);

    return actionRows;
}

function findComponent(interaction: MessageComponentInteraction, customId: string): {actionRowIndex: number, componentIndex: number} | undefined {
    const actionRows = interaction.message.components;
    for (let actionRowIndex = 0; actionRowIndex < actionRows.length; ++actionRowIndex) {
        const actionRow = actionRows[actionRowIndex];

        for (let componentIndex = 0; componentIndex < actionRow.components.length; ++componentIndex) {
            if (actionRow.components[componentIndex].customId === customId) {
                return {
                    actionRowIndex,
                    componentIndex,
                };
            }
        }
    }
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

async function executeLogVoice(interaction: ChatInputCommandInteraction): InteractionExecuteResponse {
    const subCommand= interaction.options.getSubcommand(true);
    if (subCommand === logVoiceSetName) {
        return executeLogVoiceSet(interaction);
    }
    return executeLogVoiceDelete(interaction);
}

async function executeLogVoiceDelete(interaction: ChatInputCommandInteraction): InteractionExecuteResponse {
    const { guildId } = getInteractionMetadata(interaction);
    await databaseHelper.updateServerSetting(guildId, { logVoiceStateChannel: undefined });
}

async function executeLogVoiceSet(interaction: ChatInputCommandInteraction): InteractionExecuteResponse {
    const { guildId } = getInteractionMetadata(interaction);
    const channel = interaction.options.getChannel(channelCommandName, true);

    if (channel.type !== ChannelType.GuildText) {
        throw new InteractionError(interaction, CommandLangKey.ERRORS_INVALID_TEXT_CHANNEL);
    }

    await databaseHelper.updateServerSetting(guildId, { logVoiceStateChannel: channel.id });
}

export default command;
