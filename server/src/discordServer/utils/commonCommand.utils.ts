import { getCommandLang, getCommandLangKey, getDefaultCommandLang } from '../applicationCommands/commandLang';
import { CommandLangKey } from '../applicationCommands/types/lang.types';
import type {
    APIApplicationCommandOptionChoice,
    AutocompleteInteraction,
    BaseInteraction,
    ChatInputCommandInteraction,
    SlashCommandChannelOption,
    SlashCommandIntegerOption,
    SlashCommandStringOption,
    SlashCommandUserOption
} from 'discord.js';
import { ContextMenuCommandBuilder, GuildMember, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { databaseHelper } from '../../services/databaseHelper';
import { APPLICATION_COMMAND_MAX_CHOICES } from '../constants';
import type { InteractionAutocomplete } from '../../interfaces/command';
import type { ApplicationCommandOptionBase, SharedNameAndDescription } from '@discordjs/builders';
import { playSound } from '../../services/musicPlayer';
import { InteractionError } from '../../utils/InteractionError';
import {
    getAvailableApplicationCommands,
    getRegisteredApplicationCommands
} from '../applicationCommands/applicationManager';
import escapeStringRegexp from '../../utils/regex.utils';

type CommandOption<T extends ApplicationCommandOptionBase> = (command: T) => T;
type UserOption = { userOption: CommandOption<SlashCommandUserOption>, userCommandName: string};
type SoundSelection = { soundOption: CommandOption<SlashCommandStringOption>, soundCommandName: string, autocomplete: InteractionAutocomplete};
type CommandSelection = { commandOption: CommandOption<SlashCommandStringOption>, commandSelectionName: string};
type ChannelSelection = {channelOption: CommandOption<SlashCommandChannelOption>, channelCommandName: string};
type VolumeOption = {volumeOption: CommandOption<SlashCommandIntegerOption>, volumeCommandName: string}

export function getUserOption(required = true): UserOption {
    return {
        userOption: (option) =>
            getLangComponent(option, CommandLangKey.ADMIN_SET_USER_INTRO_USER_NAME, CommandLangKey.ADMIN_SET_USER_INTRO_USER_DESCRIPTION)
                .setRequired(required),
        userCommandName: getDefaultCommandLang(CommandLangKey.ADMIN_SET_USER_INTRO_USER_NAME),
    };
}

export function getSoundSelection(required = true, onlyWhereCreator = false): SoundSelection {
    return {
        soundOption: (option) =>
            getLangComponent(option, CommandLangKey.PLAY_FILE_NAME, CommandLangKey.PLAY_FILE_DESCRIPTION)
                .setRequired(required)
                .setAutocomplete(true),
        soundCommandName: getDefaultCommandLang(CommandLangKey.PLAY_FILE_NAME),
        async autocomplete(interaction) {
            try {
                const { member, guildId } = getInteractionMetadata(interaction);
                const value = interaction.options.getFocused();
                // return all sounds if the user that requests it is the admin
                const creatorId = member.permissions.has(PermissionsBitField.Flags.Administrator) || !onlyWhereCreator ? undefined : member.id;
                const sounds = await databaseHelper.getSoundsMetaByName(value, guildId, APPLICATION_COMMAND_MAX_CHOICES, creatorId);

                return sounds.map((sound) => (
                    {
                        value: sound.fileName,
                        name: sound.fileName,
                    }
                ));
            } catch {
                return [];
            }
        },
    };
}

export function getChannelOption(required = true): ChannelSelection {
    return {
        channelOption: (option) =>
            option
                .setName(getDefaultCommandLang(CommandLangKey.CHANNEL_NAME))
                .setNameLocalizations(getCommandLang(CommandLangKey.CHANNEL_NAME))
                .setDescription(getDefaultCommandLang(CommandLangKey.CHANNEL_DESCRIPTION))
                .setDescriptionLocalizations(getCommandLang(CommandLangKey.CHANNEL_DESCRIPTION))
                .setRequired(required),
        channelCommandName: getDefaultCommandLang(CommandLangKey.CHANNEL_NAME),
    };
}

export function getCommandSelection(required = true): CommandSelection {
    return {
        commandSelectionName: getDefaultCommandLang(CommandLangKey.COMMAND_SELECTION_NAME),
        commandOption: (option) =>
            getLangComponent(option, CommandLangKey.COMMAND_SELECTION_NAME, CommandLangKey.COMMAND_SELECTION_DESCRIPTION)
                .setRequired(required)
                .setAutocomplete(true),
    };
}

export async function getCommandSelectionAutocompleteRegistered(interaction: AutocompleteInteraction) {
    const { guildId } = getInteractionMetadata(interaction);
    const value = interaction.options.getFocused();
    const regex = new RegExp(escapeStringRegexp(value), 'i');

    const commands =  await getRegisteredApplicationCommands(interaction.client, guildId);
    const foundCommands = commands.filter((cmd) => (cmd.nameLocalizations?.[interaction.locale] ?? cmd.name).match(regex));
    return [...foundCommands.values()].slice(0, APPLICATION_COMMAND_MAX_CHOICES).map((cmd) => ({
        value: cmd.name,
        name: cmd.nameLocalizations?.[interaction.locale] ?? cmd.name,
    }));
}

export function getCommandSelectionAutocompleteAvailable(interaction: AutocompleteInteraction): APIApplicationCommandOptionChoice[] {
    const value = interaction.options.getFocused();
    const regex = new RegExp(escapeStringRegexp(value), 'i');

    const allCommands = getAvailableApplicationCommands();
    const foundCommands = allCommands.filter((cmd) => (cmd.data.name_localizations?.[interaction.locale] ?? cmd.data.name).match(regex));
    return foundCommands.slice(0, APPLICATION_COMMAND_MAX_CHOICES).map((cmd) => ({
        value: cmd.data.name,
        name: cmd.data.name_localizations?.[interaction.locale] ?? cmd.data.name,
    }));
}

export function getVolumeInput(required = false): VolumeOption {
    return {
        volumeOption: (option) =>
            getLangComponent(option, CommandLangKey.PLAY_VOLUME_NAME, CommandLangKey.PLAY_VOLUME_DESCRIPTION)
                .setRequired(required)
                .setMinValue(0)
                .setMaxValue(100),
        volumeCommandName: getDefaultCommandLang(CommandLangKey.PLAY_VOLUME_NAME),
    };
}

export function getScopedContextMenuBuilder(nameKey: CommandLangKey): ContextMenuCommandBuilder {
    return new ContextMenuCommandBuilder()
        .setName(getDefaultCommandLang(nameKey))
        .setNameLocalizations(getCommandLang(nameKey));
}

export function getLangSlashCommandBuilder(nameKey: CommandLangKey, descriptionKey: CommandLangKey): SlashCommandBuilder {
    return new SlashCommandBuilder()
        .setName(getDefaultCommandLang(nameKey))
        .setDescription(getDefaultCommandLang(descriptionKey))
        .setNameLocalizations(getCommandLang(nameKey))
        .setDescriptionLocalizations(getCommandLang(descriptionKey));
}

export function getLangComponent<T extends SharedNameAndDescription>(option: T, nameKey: CommandLangKey, descriptionKey: CommandLangKey): T {
    return option
        .setName(getDefaultCommandLang(nameKey))
        .setNameLocalizations(getCommandLang(nameKey))
        .setDescription(getDefaultCommandLang(descriptionKey))
        .setDescriptionLocalizations(getCommandLang(descriptionKey));
}

function transformVolume(volume?: number): number | undefined {
    return volume !== undefined ? volume/100 : undefined;
}

export async function playSoundThroughInteraction(interaction: ChatInputCommandInteraction, fileCommand: string, volumeCommand: string, forcePlay = false): Promise<string | undefined> {
    const { member, guildId } = getInteractionMetadata(interaction);
    const file = interaction.options.getString(fileCommand, true);
    const volume = interaction.options.getInteger(volumeCommand) ?? undefined;

    if (!member.voice.channelId) {
        return getCommandLangKey(interaction, CommandLangKey.ERRORS_NOT_IN_VOICE_CHANNEL);
    }

    const meta = await databaseHelper.getSoundMetaByName(file, guildId);
    if (!meta?.path) {
        return getCommandLangKey(interaction, CommandLangKey.ERRORS_FILE_NOT_FOUND);
    }
    await playSound(guildId, member.voice.channelId, meta.path, transformVolume(volume), undefined, forcePlay);
}

export async function playYoutubeThroughInteraction(interaction: ChatInputCommandInteraction, urlCommand: string, volumeCommand: string): Promise<string | undefined> {
    const { member, guildId } = getInteractionMetadata(interaction);
    const url = interaction.options.getString(urlCommand, true);
    const volume = interaction.options.getInteger(volumeCommand) ?? undefined;

    if (!member.voice.channelId) {
        return getCommandLangKey(interaction, CommandLangKey.ERRORS_NOT_IN_VOICE_CHANNEL);
    }

    await playSound(guildId, member.voice.channelId, undefined, transformVolume(volume) ?? 0.5, url);
}

export function getInteractionMetadata(interaction: BaseInteraction): {member: GuildMember, guildId: string} {
    const guildId = getGuildIdOfInteraction(interaction);
    const member = getMemberOfInteraction(interaction);

    return { member, guildId };
}

function getMemberOfInteraction(interaction: BaseInteraction): GuildMember {
    if (!interaction.member || !(interaction.member instanceof GuildMember)) {
        throw new InteractionError(interaction, CommandLangKey.ERRORS_INVALID_MEMBER);
    }
    return interaction.member;
}

function getGuildIdOfInteraction(interaction: BaseInteraction): string {
    if (!interaction.guildId) {
        throw new InteractionError(interaction, CommandLangKey.ERRORS_INVALID_GUILD);
    }
    return interaction.guildId;
}

export function takeRandom<T>(array: T[]): T {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}
