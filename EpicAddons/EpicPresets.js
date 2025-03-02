import { Command } from "../../src/Modules/Structures/Handlers/Commands.js";
import { Addon } from "../../src/Modules/Structures/Handlers/Addons.js";
import Utils from "../../src/Modules/Utils.js";
import chalk from "chalk";
import {
  ChannelType,
  Message,
  PermissionsBitField,
  TextChannel,
} from "discord.js";
import { Settings as SetupMessageSettings } from "../../src/Modules/Utils/setupMessage.js";
import fs from "fs";
import path from "path";

let __dirname = path.resolve(path.dirname(""));

const addon = new Addon("EpicPresets", "v1.0.0"),
  addonConfig = {
    Config: {
      "~00": "Does user need `SEND_MESSAGES` permission?",
      CheckPermission: true,
    },
    Commands: {
      "~00": "Preset command",
      Preset: {
        "~01": "Whenever this command is enabled",
        Enabled: true,
        "~02": "Command Name",
        Name: "preset",
        "~03": "Command Description",
        Description: "Send message preset from config",
        "~04": "Command usage",
        "~05": "THIS WON'T CHANGE ANYTHING. Only for translation purposes!",
        Usage: "preset [name] (channel)",
        "~06": "Command cooldown",
        Cooldown: 0,
        "~07": "Command permissions",
        Permission: ["Admin"],
        "~08": "Whenever command message should be deleted",
        DeleteCommand: false,
        "~09": "Command options (You can only change description option)",
        Arguments: [
          {
            Type: "String",
            Name: "name",
            Description: "Preset name",
            AutoComplete: true,
            Required: false,
          },
          {
            Type: "Channel",
            Name: "channel",
            Description: "Where preset should be sent?",
            Required: false,
          },
        ],
      },
    },
    Language: {
      "~00": "Messages used by addon.",
      "~01": "It's RECOMENDED to use placeholders here.",
      Messages: {
        "~02": "Message for successful preset sending",
        SuccessfullySend: {
          Embeds: [
            {
              Title: "Preset has been successfuly sent",
              Color: "#FFFF00",
              Author: "{user-tag}",
              AuthorIcon: "{user-pfp}",
              Description:
                "Preset **{preset}** has been successfuly sent in {channel}.",
              Footer: "{guild-name}",
              FooterIcon: "{guild-icon}",
              Timestamp: true,
            },
          ],
        },
        "~03": "Message for presetes list",
        PresetsList: {
          Embeds: [
            {
              Title: "Presets list",
              Color: "#FFFF00",
              Description: "Presets available to send with preset command.",
              Fields: [
                {
                  Name: "Presets",
                  Value: "> {presets}",
                  Inline: true,
                },
              ],
              Footer: "{guild-name}",
              FooterIcon: "{guild-icon}",
              Timestamp: true,
            },
          ],
        },
        "~04": "Error's Messages used by addon.",
        Errors: {
          "~05":
            "Error Message, which will be send if user wrongly use the command.",
          "~06":
            "It's recomended to use {usage} placeholder, which will show command usage.",
          WrongCommandUsage: {
            Content: "⚠️ An error occured ⚠️",
            Embeds: [
              {
                Title: "Wrong command usage!",
                Color: "#FF0000",
                Author: "{guild-name}",
                AuthorIcon: "{guild-icon}",
                Description: "Usage: `{usage}`",
                Thumbnail: "{guild-icon}",
                Timestamp: true,
              },
            ],
          },
          "~07": "Error Message, which will be send if preset does't exist.",
          InvalidPreset: {
            Content: "⚠️ An error occured ⚠️",
            Embeds: [
              {
                Title: "Invalid preset!",
                Color: "#FF0000",
                Author: "{guild-name}",
                AuthorIcon: "{guild-icon}",
                Description:
                  "Preset **{preset}** was not found\n> Check if you typed everything correctly and try again.",
                Thumbnail: "{guild-icon}",
                Timestamp: true,
              },
            ],
          },
          "~08":
            "Error Message, which will be send if user mentions invalid channel.",
          InvalidChannel: {
            Content: "⚠️ An error occured ⚠️",
            Embeds: [
              {
                Title: "Invalid channel!",
                Color: "#FF0000",
                Author: "{guild-name}",
                AuthorIcon: "{guild-icon}",
                Description:
                  "Provided channel is invalid\n> Check if you typed everything correctly and if you have perms to send messages on selected channel.",
                Thumbnail: "{guild-icon}",
                Timestamp: true,
              },
            ],
          },
        },
      },
    },
    Presets: {
      "~00": "Welcome in Presets File",
      "~01": "Here, you can create your own Message Presets",
      "~02": "You can send them with command `preset [name] (channel)`",
      "~03": "Only thing, you need is following the example",
      Presets: [
        {
          Name: "example",
          Message: {
            Content: "Message Content",
            Embeds: [
              {
                Author: "Embed author",
                AuthorIcon:
                  "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_960_720.png",
                Title: "Embed Title",
                Description: "Embed Description",
                Fields: [
                  {
                    Name: "Field name",
                    Value: "Field description",
                    Inline: true,
                  },
                ],
                Footer: "Embed Footer",
                FooterIcon:
                  "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_960_720.png",
                Thumbnail:
                  "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_960_720.png",
                Image:
                  "https://t3.ftcdn.net/jpg/02/48/42/64/360_F_248426448_NVKLywWqArG2ADUxDq6QprtIzsF82dMF.jpg",
                Color: "#FFFF00",
                Timestamp: true,
              },
            ],
            Components: {
              1: [
                {
                  Type: "Button",
                  Style: "Primary",
                  Label: "Example",
                  CustomID: "button",
                },
                {
                  Type: "Button",
                  Style: "Link",
                  Label: "Example Link",
                  Link: "https://example.com",
                },
              ],
              2: [
                {
                  Type: "SelectMenu",
                  Placeholder: "Example",
                  CustomID: "menu",
                  MinSelect: 0,
                  MaxSelect: 5,
                  Options: [
                    {
                      Default: false,
                      Label: "Option 1",
                      Description: "Option 1 Description",
                      Value: "option1",
                    },
                    {
                      Default: false,
                      Label: "Option 2",
                      Description: "Option 2 Description",
                      Value: "option2",
                    },
                    {
                      Default: false,
                      Label: "Option 3",
                      Description: "Option 3 Description",
                      Value: "option3",
                    },
                    {
                      Default: false,
                      Label: "Option 4",
                      Description: "Option 4 Description",
                      Value: "option4",
                    },
                    {
                      Default: false,
                      Label: "Option 5",
                      Description: "Option 5 Description",
                      Value: "option5",
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          Name: "example2",
          Message: {
            Content: "Message Content v2",
            Embeds: [
              {
                Author: "Embed author v2",
                AuthorIcon:
                  "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_960_720.png",
                Title: "Embed Title v2",
                Description: "Embed Description v2",
                Fields: [
                  {
                    Name: "Field name v2",
                    Value: "Field description v2",
                    Inline: true,
                  },
                ],
                Footer: "Embed Footer v2",
                FooterIcon:
                  "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_960_720.png",
                Thumbnail:
                  "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_960_720.png",
                Image:
                  "https://t3.ftcdn.net/jpg/02/48/42/64/360_F_248426448_NVKLywWqArG2ADUxDq6QprtIzsF82dMF.jpg",
                Color: "#FFFF00",
                Timestamp: true,
              },
            ],
            Components: {
              1: [
                {
                  Type: "Button",
                  Style: "Primary",
                  Label: "Example",
                  CustomID: "button",
                },
                {
                  Type: "Button",
                  Style: "Link",
                  Label: "Example Link",
                  Link: "https://example.com",
                },
              ],
              2: [
                {
                  Type: "SelectMenu",
                  Placeholder: "Example",
                  CustomID: "menu",
                  MinSelect: 1,
                  MaxSelect: 5,
                  Options: [
                    {
                      Default: true,
                      Label: "Option 1",
                      Description: "Option 1 Description",
                      Value: "option1",
                    },
                    {
                      Default: false,
                      Label: "Option 2",
                      Description: "Option 2 Description",
                      Value: "option2",
                    },
                    {
                      Default: false,
                      Label: "Option 3",
                      Description: "Option 3 Description",
                      Value: "option3",
                    },
                    {
                      Default: false,
                      Label: "Option 4",
                      Description: "Option 4 Description",
                      Value: "option4",
                    },
                    {
                      Default: false,
                      Label: "Option 5",
                      Description: "Option 5 Description",
                      Value: "option5",
                    },
                  ],
                },
              ],
            },
          },
        },
      ],
      "~04": "INFO: These presets are made as example of EpicPresets",
    },
  };

/** @type {addonConfig} */
const { Config, Commands, Language, Presets } = addon.customConfig(addonConfig);

const Logger = {
  Banner: chalk.hex("#A200FF").bold("[EpicPresets] "),
  logInfo: (...i) => Utils.logger.info(Logger.Banner, ...i),
  logWarning: (...w) => Utils.logger.warn(Logger.Banner, ...w),
  logError: (...e) => Utils.logger.error(Logger.Banner, ...e),
};

addon
  .setDeveloper("SimonB50")
  .setDiscord("https://discord.gg/SgUjx2KJUd")
  .setDocs("https://simonb50.gitbook.io/docs/");

const PresetData = {
  Name: String,
  Message: SetupMessageSettings.configPath,
};
const MessageVariable = SetupMessageSettings.variables;

/**
 * Get preset data from config
 * @param {string} presetName
 * @returns {PresetData}
 */
const getPreset = (presetName) => {
  const presetData = Presets.Presets.find((x) => x.Name == presetName);
  if (!presetData)
    throw new Error(`${chalk.bold(presetName)} is not a valid preset!`);
  return presetData;
};

/**
 * Send message from preset
 * @param {string} presetName
 * @param {TextChannel} channel
 * @param {MessageVariable} variables
 * @returns {boolean}
 */
const sendPreset = (presetName, channel, variables = []) => {
  const presetData = getPreset(presetName);
  channel.send(
    Utils.setupMessage({
      configPath: presetData.Message,
      variables: variables,
    })
  );
  return true;
};

/**
 * Edit message content from preset
 * @param {Message} message
 * @param {string} presetName
 * @param {MessageVariable} variables
 * @returns {boolean}
 */
const editPreset = (message, presetName, variables = []) => {
  const presetData = getPreset(presetName);
  message.edit(
    Utils.setupMessage({
      configPath: presetData.Message,
      variables: variables,
    })
  );
  return true;
};

addon.setExecute(async (manager) => {
  new Command({
    commandData: Commands.Preset,
    commandConfig: {
      guildOnly: true,
      dmOnly: false,
      requiredPermissions: {
        user: [],
        bot: [PermissionsBitField.Flags.SendMessages],
      },
    },
    LegacyRun: (manager, message, args, prefixUsed, commandData) => {
      // Get preset name
      let presetName = args[0];
      if (!presetName) {
        return message.reply(
          Utils.setupMessage({
            configPath: Language.Messages.PresetsList,
            variables: [
              {
                searchFor: /{presets}/g,
                replaceWith: Presets.Presets.map((x) => `\`${x.Name}\``).join(
                  ", "
                ),
              },
              ...Utils.userVariables(message.member),
              ...Utils.guildVariables(message.guild),
              ...Utils.botVariables(manager),
            ],
          })
        );
      }

      // Get channel where preset should be sent
      let presetChannel = args[1]
        ? Utils.findChannel(ChannelType.GuildText, args[1].replace(/<#|>/g, ""))
        : message.channel;
      if (
        !presetChannel ||
        (Config.CheckPermission &&
          !presetChannel
            .permissionsFor(message.member)
            .has(PermissionsBitField.Flags.SendMessages))
      )
        return message.reply(
          Utils.setupMessage({
            configPath: Language.Messages.Errors.InvalidChannel,
            variables: [
              ...Utils.userVariables(message.member),
              ...Utils.guildVariables(message.guild),
              ...Utils.botVariables(manager),
            ],
          })
        );

      try {
        sendPreset(presetName, presetChannel, [
          ...Utils.userVariables(message.member),
          ...Utils.guildVariables(message.guild),
          ...Utils.botVariables(manager),
        ]);
        return message.reply(
          Utils.setupMessage({
            configPath: Language.Messages.SuccessfullySend,
            variables: [
              {
                searchFor: /{preset}/g,
                replaceWith: presetName,
              },
              {
                searchFor: /{channel}/g,
                replaceWith: presetChannel,
              },
              ...Utils.userVariables(message.member),
              ...Utils.guildVariables(message.guild),
              ...Utils.botVariables(manager),
            ],
          })
        );
      } catch (error) {
        return message.reply(
          Utils.setupMessage({
            configPath: Language.Messages.Errors.InvalidPreset,
            variables: [
              {
                searchFor: /{preset}/g,
                replaceWith: presetName,
              },
              ...Utils.userVariables(message.member),
              ...Utils.guildVariables(message.guild),
              ...Utils.botVariables(manager),
            ],
          })
        );
      }
    },
    InteractionRun: (manager, interaction, commandData) => {
      // Get preset name
      let presetName = interaction.options.getString("name");
      if (!presetName) {
        return interaction.reply(
          Utils.setupMessage({
            configPath: Language.Messages.PresetsList,
            variables: [
              {
                searchFor: /{presets}/g,
                replaceWith: Presets.Presets.map((x) => `\`${x.Name}\``).join(
                  ", "
                ),
              },
              ...Utils.userVariables(interaction.member),
              ...Utils.guildVariables(interaction.guild),
              ...Utils.botVariables(manager),
            ],
          })
        );
      }

      // Get channel where preset should be sent
      let presetChannel =
        interaction.options.getChannel("channel") || interaction.channel;

      try {
        sendPreset(presetName, presetChannel, [
          ...Utils.userVariables(interaction.member),
          ...Utils.guildVariables(interaction.guild),
          ...Utils.botVariables(manager),
        ]);
        return interaction.reply(
          Utils.setupMessage({
            configPath: Language.Messages.SuccessfullySend,
            variables: [
              {
                searchFor: /{preset}/g,
                replaceWith: presetName,
              },
              {
                searchFor: /{channel}/g,
                replaceWith: presetChannel,
              },
              ...Utils.userVariables(interaction.member),
              ...Utils.guildVariables(interaction.guild),
              ...Utils.botVariables(manager),
            ],
          })
        );
      } catch (error) {
        return interaction.reply(
          Utils.setupMessage({
            configPath: Language.Messages.Errors.InvalidPreset,
            variables: [
              {
                searchFor: /{preset}/g,
                replaceWith: presetName,
              },
              ...Utils.userVariables(interaction.member),
              ...Utils.guildVariables(interaction.guild),
              ...Utils.botVariables(manager),
            ],
          })
        );
      }
    },
    AutoComplete: async (manager, interaction) => {
      const focused = interaction.options.getFocused(true);
      if (focused.name != "name") return;
      await interaction.respond(
        Presets.Presets.map((x) => ({
          name: x.Name,
          value: x.Name,
        })).filter((x) => x.name.includes(focused.value) || !focused.value)
      );
    },
  });
  // Hook with epicActions if detected
  if (fs.existsSync(`${__dirname}\\data\\addons\\EpicScript.js`)) {
    const presetActions = [
      {
        type: "Preset",
        action: "Send",
        arguments: [
          {
            name: "Preset",
            type: "text",
            required: true,
          },
          {
            name: "Channel",
            type: "channel",
            required: false,
          },
        ],
        requirements: {
          user: false,
          channel: false,
          message: false,
        },
        actionRun: async (
          actionUser,
          actionChannel,
          actionMessage,
          actionArguments
        ) => {
          const preset = actionArguments.find(
            (arg) => arg.name === "Preset"
          ).value;
          const channel =
            actionArguments.find((arg) => arg.name === "Channel").value ||
            actionChannel;
          if (!channel)
            throw new Error(
              "Preset:Send action requires either Channel argument or actionChannel."
            );
          let variables = [
            ...Utils.channelVariables(channel),
            ...Utils.guildVariables(channel.guild),
            ...Utils.botVariables(manager),
          ];
          if (actionUser) variables.push(...Utils.userVariables(actionUser));
          sendPreset(preset, channel, variables);
        },
      },
      {
        type: "Preset",
        action: "Edit",
        arguments: [
          {
            name: "NewPreset",
            type: "text",
            required: true,
          },
        ],
        requirements: {
          user: false,
          channel: false,
          message: true,
        },
        actionRun: async (
          actionUser,
          actionChannel,
          actionMessage,
          actionArguments
        ) => {
          const preset = actionArguments.find(
            (arg) => arg.name === "NewPreset"
          ).value;
          const message = actionMessage;
          let variables = [
            ...Utils.channelVariables(message.channel),
            ...Utils.guildVariables(message.guild),
            ...Utils.userVariables(message.member, "author"),
            ...Utils.botVariables(manager),
          ];
          if (actionUser) variables.push(...Utils.userVariables(actionUser));
          editPreset(message, preset, variables);
        },
      },
    ];
    const { registerAction } = await import("./EpicScript.js");
    for (const action of presetActions) registerAction(action);
  }
  Logger.logInfo(`Addon loaded! Author: ${chalk.bold("Simonb50")}`);
});

export default addon;
export { getPreset, sendPreset, editPreset };
