import { ChannelType, Events, Message } from "discord.js";
import { BryanBot } from "../../src/Modules/Structures/BryanBot.js";
import { Addon } from "../../src/Modules/Structures/Handlers/Addons.js";
import {
  EventEmitter,
  EventListener,
} from "../../src/Modules/Structures/Handlers/Events.js";
import Utils from "../../src/Modules/Utils.js";
import chalk from "chalk";

const addon = new Addon("AntiGhostPing", "v1.0.0"),
  addonConfig = {
    Config: {
      "~00": "Ignore GhostPings section",
      Ignored: {
        "~01": "GhostPing from these users won't be detected",
        Users: ["simonb50"],
        "~02": "GhostPings from people, who have these roles won't be detected",
        Roles: ["Admin"],
        "~03": "GhostPings in these channels won't be detected",
        Channels: ["news"],
        "~04": "GhostPing in these categories won't be detected",
        Categories: ["tickets"],
        "~05": "Should GhostPings from bots be ignored?",
        Bots: true,
      },
      "~07": "Which GhostPings should be detected?",
      Mentions: {
        "~08": "Users' pings detection",
        User: true,
        "~09": "Roles' pings detection",
        Role: true,
        "~10": "@everyone and @here pings detection",
        Everyone: true,
      },
      "~11": "Logging options",
      Logging: {
        "~12":
          "Should info about GhostPing be send in channel, where it was detected?",
        MessageChannel: true,
        "~13": "Admin logging options",
        Logs: {
          "~14": "Should all GhostPing be sent into logs channel?",
          Enabled: false,
          "~15": "Admin logging channel, where GhostPings should be send",
          Channel: "ghost-pings",
        },
      },
    },
    Language: {
      "~01": "Messages used by addon.",
      "~02": "It's RECOMENDED to use placeholders here.",
      Messages: {
        "~03": "Ghots Ping Message",
        "~04": "It's recomended to use these placeholders:",
        "~05":
          "- Message Author variables(like {user-username}, {user-pfp} etc.)",
        "~06": "- {message} - Ghots Ping message content",
        GhostPing: {
          Content: "👻 Ghost Ping detected 👻",
          Embeds: [
            {
              Title: "Ghost Ping Found!",
              Color: "#FFFF00",
              Author: "{user-tag}",
              AuthorIcon: "{user-pfp}",
              Fields: [
                {
                  Name: "User",
                  Value: "{user-mention}",
                  Inline: true,
                },
                {
                  Name: "Message",
                  Value: "{message}",
                  Inline: true,
                },
              ],
              Thumbnail: "https://i.imgur.com/lb4kKPU.png",
              Footer: "{brand-name}",
              FooterIcon: "{brand-logo}",
              Timestamp: true,
            },
          ],
        },
        "~07": "GhostPing log message - only works, when enabled",
        "~08":
          "You can use {channel-?} variables, to get ghostping channel info",
        GhostPingLog: {
          Embeds: [
            {
              Title: "Ghost Ping Found!",
              Color: "#FFFF00",
              Author: "{user-tag}",
              AuthorIcon: "{user-pfp}",
              Fields: [
                {
                  Name: "User",
                  Value: "{user-mention}",
                  Inline: true,
                },
                {
                  Name: "Message",
                  Value: "{message}",
                  Inline: true,
                },
                {
                  Name: "Channel",
                  Value: "{channel-mention}",
                  Inline: true,
                },
              ],
              Thumbnail: "https://i.imgur.com/lb4kKPU.png",
              Footer: "{brand-name}",
              FooterIcon: "{brand-logo}",
              Timestamp: true,
            },
          ],
        },
      },
    },
  };

/** @type {addonConfig} */
const { Config, Language } = addon.customConfig(addonConfig);

const Logger = {
  Banner: chalk.hex("#ffffff").bold("[AntiGhostPing] "),
  logInfo: (...i) => Utils.logger.info(Logger.Banner, ...i),
  logWarning: (...w) => Utils.logger.warn(Logger.Banner, ...w),
  logError: (...e) => Utils.logger.error(Logger.Banner, ...e),
};

addon
  .setDeveloper("SimonB50")
  .setDiscord("https://discord.gg/SgUjx2KJUd")
  .setDocs("https://simonb50.gitbook.io/docs/");

addon.setExecute(async (manager) => {
  new EventListener(
    Events.MessageDelete,
    /**
     * Message delete event
     * @param {BryanBot} manager
     * @param {Message} message
     */
    async (manager, message) => {
      // Check if channel is DM
      if (message.channel.type === "DM") return;

      // Check for pings
      if (
        !(Config.Mentions.User && message.mentions.users.first()) &&
        !(Config.Mentions.Role && message.mentions.roles.first()) &&
        !(Config.Mentions.Everyone && message.mentions.everyone)
      )
        return;

      // Check if ignored
      const ignored = [false];
      if (
        Config.Ignored.Users.includes(message.author.id) ||
        Config.Ignored.Users.includes(message.author.username)
      )
        ignored.push(true);
      if (Utils.hasPermission(Config.Ignored.Roles, message.member))
        ignored.push(true);
      if (
        Config.Ignored.Channels.includes(message.channel.id) ||
        Config.Ignored.Channels.includes(message.channel.name)
      )
        ignored.push(true);
      if (
        message.channel.parent &&
        (Config.Ignored.Categories.includes(message.channel.parent.id) ||
          Config.Ignored.Categories.includes(message.channel.parent.name))
      )
        ignored.push(true);
      if (Config.Ignored.Bots && message.author.bot) ignored.push(true);
      if (ignored.includes(true)) return;

      // Emit GhostPing event
      new EventEmitter("ghostPing", message);
    }
  );

  new EventListener(
    Events.MessageUpdate,
    /**
     * Message update event
     * @param {BryanBot} manager
     * @param {Message} oldMessage
     * @param {Message} newMessage
     */
    async (manager, oldMessage, newMessage) => {
      // Check if channel is DM
      if (oldMessage.channel.type === "DM") return;

      // Check for deleted mentions
      if (
        !(
          Config.Mentions.User &&
          oldMessage.mentions.members.some((x) => !newMessage.mentions.has(x))
        ) &&
        !(
          Config.Mentions.Role &&
          oldMessage.mentions.roles.some((x) => !newMessage.mentions.has(x))
        ) &&
        !(
          Config.Mentions.Everyone &&
          oldMessage.mentions.everyone &&
          !newMessage.mentions.everyone
        )
      )
        return;

      // Check if ignored
      const ignored = [false];
      if (
        Config.Ignored.Users.includes(oldMessage.author.id) ||
        Config.Ignored.Users.includes(oldMessage.author.username)
      )
        ignored.push(true);
      if (Utils.hasPermission(Config.Ignored.Roles, newMessage.member))
        ignored.push(true);
      if (
        Config.Ignored.Channels.includes(oldMessage.channel.id) ||
        Config.Ignored.Channels.includes(oldMessage.channel.name)
      )
        ignored.push(true);
      if (
        oldMessage.channel.parent &&
        (Config.Ignored.Categories.includes(oldMessage.channel.parent.id) ||
          Config.Ignored.Categories.includes(oldMessage.channel.parent.name))
      )
        ignored.push(true);
      if (Config.Ignored.Bots && oldMessage.author.bot) ignored.push(true);
      if (ignored.includes(true)) return;

      // Emit ghostPing event
      new EventEmitter("ghostPing", oldMessage);
    }
  );

  new EventListener(
    "ghostPing",
    /**
     * GhostPing event
     * @param {BryanBot} manager
     * @param {Message} message
     */
    async (manager, message) => {
      if (Config.Logging.MessageChannel)
        message.channel
          .send(
            Utils.setupMessage({
              configPath: Language.Messages.GhostPing,
              variables: [
                {
                  searchFor: /{message}/g,
                  replaceWith:
                    (message.mentions.repliedUser
                      ? "↳ <@" + message.mentions.repliedUser.id + "> | "
                      : "") + message.content,
                },
                ...Utils.userVariables(message.member),
                ...Utils.botVariables(manager),
                ...Utils.channelVariables(message.channel),
                ...Utils.guildVariables(message.guild),
              ],
            })
          )
          .catch((e) => Logger.logError(e.message));

      if (Config.Logging.Logs.Enabled) {
        const channel = Utils.findChannel(
          ChannelType.GuildText,
          message.guild,
          Config.Logging.Logs.Channel
        );

        if (!channel)
          return Logger.logError(
            "Invalid Logs channel has been provided in addon configs. GhostPing logs won't be send."
          );

        channel
          .send(
            Utils.setupMessage({
              configPath: Language.Messages.GhostPingLog,
              variables: [
                {
                  searchFor: /{message}/g,
                  replaceWith:
                    (message.mentions.repliedUser
                      ? "↳ <@" + message.mentions.repliedUser.id + "> | "
                      : "") + message.content,
                },
                ...Utils.userVariables(message.member),
                ...Utils.botVariables(manager),
                ...Utils.channelVariables(message.channel),
                ...Utils.guildVariables(message.guild),
              ],
            })
          )
          .catch((e) => Logger.logError(e.message));
      }
    }
  );
  Logger.logInfo(`Addon loaded! Author: ${chalk.bold("Simonb50")}`);
});

export default addon;
