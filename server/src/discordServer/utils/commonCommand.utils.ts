import { getCommandLang, getCommandLangKey, getDefaultCommandLang } from '../applicationCommands/commandLang';
import { CommandLangKey } from '../applicationCommands/types/lang.types';
import type {
    ChatInputCommandInteraction,
    InteractionResponse,
    MessageContextMenuCommandInteraction,
    SlashCommandIntegerOption,
    SlashCommandStringOption,
    SlashCommandUserOption
} from 'discord.js';
import { ContextMenuCommandBuilder, PermissionsBitField, SlashCommandBuilder } from 'discord.js';
import { databaseHelper } from '../../services/databaseHelper';
import { APPLICATION_COMMAND_MAX_CHOICES } from '../constants';
import type { InteractionAutocomplete } from '../../interfaces/command';
import type { ApplicationCommandOptionBase } from '@discordjs/builders';
import { getInteractionMetadata } from '../applicationCommands/applicationManager';
import { playSound } from '../../services/musicPlayer';

type CommandOption<T extends ApplicationCommandOptionBase> = (command: T) => T;
type UserOption = { userOption: CommandOption<SlashCommandUserOption>, userCommandName: string};
type SoundSelection = { fileNameOption: CommandOption<SlashCommandStringOption>, fileCommandName: string, autocomplete: InteractionAutocomplete};
type VolumeOption = {volumeOption: CommandOption<SlashCommandIntegerOption>, volumeCommandName: string}

const userCommandName = getDefaultCommandLang(CommandLangKey.SET_USER_INTRO_USER_NAME);
const fileCommandName = getDefaultCommandLang(CommandLangKey.PLAY_FILE_NAME);
const volumeCommandName = getDefaultCommandLang(CommandLangKey.PLAY_VOLUME_NAME);


export function setLoading(interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction, ephemeral = true): Promise<InteractionResponse<boolean>> {
    return interaction.reply({
        content: getCommandLangKey(interaction, CommandLangKey.LOADING),
        ephemeral: ephemeral,
    });
}

export function getUserOption(required = true): UserOption {
    return {
        userOption: (option) =>
            getScopedOption(option, CommandLangKey.SET_USER_INTRO_USER_NAME, CommandLangKey.SET_USER_INTRO_USER_DESCRIPTION)
                .setRequired(required),
        userCommandName,
    };
}

export function getSoundSelection(required = true, onlyWhereCreator = false): SoundSelection {
    return {
        fileNameOption: (option) =>
            getScopedOption(option, CommandLangKey.PLAY_FILE_NAME, CommandLangKey.PLAY_FILE_DESCRIPTION)
                .setRequired(required)
                .setAutocomplete(true),
        fileCommandName,
        async autocomplete(interaction) {
            try {
                const { member, guild } = await getInteractionMetadata(interaction);
                const value = interaction.options.getFocused();
                // return all sounds if the user that requests it is the admin
                const creatorId = member.permissions.has(PermissionsBitField.Flags.Administrator) || !onlyWhereCreator ? undefined : member.id;
                const sounds = await databaseHelper.getSoundsMetaByName(value, guild.id, APPLICATION_COMMAND_MAX_CHOICES, creatorId);

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

export function getVolumeInput(required = false): VolumeOption {
    return {
        volumeOption: (option) =>
            getScopedOption(option, CommandLangKey.PLAY_VOLUME_NAME, CommandLangKey.PLAY_VOLUME_DESCRIPTION)
                .setRequired(required)
                .setMinValue(0)
                .setMaxValue(100),
        volumeCommandName,
    };
}

export function getScopedContextMenuBuilder(nameKey: CommandLangKey): ContextMenuCommandBuilder {
    return new ContextMenuCommandBuilder()
        .setName(getDefaultCommandLang(nameKey))
        .setNameLocalizations(getCommandLang(nameKey));
}

export function getScopedSlashCommandBuilder(nameKey: CommandLangKey, descriptionKey: CommandLangKey): SlashCommandBuilder {
    return new SlashCommandBuilder()
        .setName(getDefaultCommandLang(nameKey))
        .setDescription(getDefaultCommandLang(descriptionKey))
        .setNameLocalizations(getCommandLang(nameKey))
        .setDescriptionLocalizations(getCommandLang(descriptionKey));
}

export function getScopedOption<T extends ApplicationCommandOptionBase>(option: T, nameKey: CommandLangKey, descriptionKey: CommandLangKey): T {
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
    const { member, guild } = await getInteractionMetadata(interaction);
    const file = interaction.options.getString(fileCommand, true);
    const volume = interaction.options.getInteger(volumeCommand) ?? undefined;

    if (!member.voice.channelId) {
        return getCommandLangKey(interaction, CommandLangKey.ERRORS_NOT_IN_VOICE_CHANNEL);
    }

    const meta = await databaseHelper.getSoundMetaByName(file);
    if (!meta?.path) {
        return getCommandLangKey(interaction, CommandLangKey.ERRORS_FILE_NOT_FOUND);
    }
    await playSound(guild.id, member.voice.channelId, meta.path, transformVolume(volume), undefined, forcePlay);
}

export async function playYoutubeThroughInteraction(interaction: ChatInputCommandInteraction, urlCommand: string, volumeCommand: string): Promise<string | undefined> {
    const { member, guild } = await getInteractionMetadata(interaction);
    const url = interaction.options.getString(urlCommand, true);
    const volume = interaction.options.getInteger(volumeCommand) ?? undefined;

    if (!member.voice.channelId) {
        return getCommandLangKey(interaction, CommandLangKey.ERRORS_NOT_IN_VOICE_CHANNEL);
    }

    await playSound(guild.id, member.voice.channelId, undefined, transformVolume(volume), url);
}
