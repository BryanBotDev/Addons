import { Command } from "../../src/Modules/Structures/Handlers/Commands.js";
import { Addon } from "../../src/Modules/Structures/Handlers/Addons.js";
import Utils from "../../src/Modules/Utils.js";
const { logger } = Utils;
import { Database } from "../../src/Modules/Structures/Handlers/Database.js";
import { EventListener } from "../../src/Modules/Structures/Handlers/Events.js";
import fetch from 'node-fetch';

const db1 = new Database("59LAddons.db");

db1.createTables([
  {
    name: "simpleEval_channels",
    values: ["id", "guild"]
  },
  {
    name: "simpleEval_users",
    values: ["id", "guild"]
  }]);
const db = db1.getDatabase()

const api = {
  database: {
    getEvalChannel: async (channelId) => {
      return db.prepare('SELECT * FROM simpleEval_channels WHERE id=?').get(channelId);
    },
    addEvalChannel: (channelId, guildId) => {
      return db.prepare('INSERT OR IGNORE INTO simpleEval_channels(id, guild) VALUES(?, ?)').run(channelId, guildId);
    },
    removeEvalChannel: (channelId) => {
      return db.prepare('DELETE FROM simpleEval_channels WHERE id = ?').run(channelId);
    },
    listEvalChannels: async (guildId) => {
      return db.prepare('SELECT * FROM simpleEval_channels WHERE guild=?').all(guildId);
    },
    getEvalUser: async (userId, guildId) => {
      return db.prepare('SELECT * FROM simpleEval_users WHERE id=? AND guild=?').get(userId, guildId);
    },
    addEvalUser: async (userId, guildId) => {
      return db.prepare('INSERT OR IGNORE INTO simpleEval_users(id, guild) VALUES(?, ?)').run(userId, guildId);
    },
    removeEvalUser: (userId, guildId) => {
      return db.prepare('DELETE FROM simpleEval_users WHERE id=? AND guild=?').run(userId, guildId);
    },
    getEvalUsers: async (guildId) => {
      return db.prepare('SELECT id FROM simpleEval_users WHERE guild=?').all(guildId);
    }
  },
  sanitizeResult: function (result) {
    if (typeof result !== "object" || result === null) return result;

    if (result instanceof Map) return `[Map(${result.size})]`;
    if (result instanceof Set) return `[Set(${result.size})]`;
    if (result instanceof Error) return `[Error: ${result.message}]`;

    if (result?.toJSON) {
      try {
        return result.toJSON();
      } catch (err) {
        return `[Object: ${result.constructor.name}]`;
      }
    }

    if (Array.isArray(result)) {
      return `[Array(${result.length})]`;
    }

    return `[Object: ${result.constructor?.name || "unknown"}]`;
  },
  Eval: async (code, runtime = {}) => {
    let consoleOutput = [];
    let consoleWarnings = [];
    let consoleErrors = [];
    const log = (message) => consoleOutput.push(message);
    const warn = (message) => consoleWarnings.push(message);
    const error = (message) => consoleErrors.push(message);

    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    }

    console.log = log;
    console.warn = warn;
    console.error = error;

    let startTime = performance.now();
    let result = null;
    let errorDetails = null;

    try {
      const variables = Object.keys(runtime);
      const declarations = variables.map(
        (variable) => `const ${variable} = runtime['${variable}'];`
      );
      const evaluatedCode = `${declarations.join("\n")}\n${code}`;

      result = await eval(`(async () => {
            ${evaluatedCode}
        })()`);

      result = api.sanitizeResult(result);
      if (typeof result === "object") {
        result = JSON.stringify(result, (key, value) => (value instanceof Function ? "[Function]" : value), 2);
      } else {
        result = result?.toString() ?? null;
      }

    } catch (err) {
      console.error(err.message)
      errorDetails = {
        name: err?.name || "UnknownError",
        message: err?.message || "No error message provided.",
        stack: err?.stack
          ? err.stack.split("\n").slice(0, 5).map(line => line.trim()).join("\n")
          : "No stack trace available."
      };
    } finally {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
    }

    let endTime = performance.now();
    let executionTime = `${(endTime - startTime).toFixed(3)} ms`;

    return {
      logs: consoleOutput.length ? consoleOutput : null,
      warnings: consoleWarnings.length ? consoleWarnings : null,
      errors: consoleErrors.length ? consoleErrors : null,
      result,
      executionTime,
      error: errorDetails,
    };
  },
  formatDiscObj: function (obj, depth = 2) {
    try {
      return `${JSON.stringify(obj, null, 2).slice(0, 4000)}`;
    } catch (error) {
      return "\`\`\`json\n[Object: Unable to format]\n\`\`\`";
    }
  },
  formatEvalEmbeds(evalData) {
    const embeds = [];
    let { logs, warnings, errors, result, executionTime, error } = evalData;

    const setTextLength = (text, limit = 4000) => text.length > limit ? text.substring(0, limit - 3) + "..." : text;

    if (Array.isArray(logs) && logs.length > 0) {
      console.log(logs, logs[0])
      embeds.push(
        Utils.setupMessage({
          configPath: lang.EvalLogs,
          variables: [
            {
              searchFor: /{logs}/g,
              replaceWith: setTextLength(["", ...logs].map(l =>
                typeof l === "object" ? api.formatDiscObj(l) : l.toString()
              ).join("\n"))
            }
          ],
        }).embeds[0]
      );

    }

    if (Array.isArray(warnings) && warnings.length > 0) {
      embeds.push(
        Utils.setupMessage({
          configPath: lang.EvalWarnings,
          variables: [{
            searchFor: /{warnings}/g, replaceWith: setTextLength(["", ...warnings].map(l =>
              typeof l === "object" ? api.formatDiscObj(l) : l.toString()
            ).join("\n"))
          }],
        }).embeds[0]
      );
    }

    if (Array.isArray(errors) && errors.length > 0) {
      embeds.push(
        Utils.setupMessage({
          configPath: lang.EvalErrors,
          variables: [{
            searchFor: /{errors}/g, replaceWith: setTextLength(["", ...errors].map(l =>
              typeof l === "object" ? api.formatDiscObj(l) : l.toString()
            ).join("\n"))
          }],
        }).embeds[0]
      );
    }

    if (!errors || !error) {
      if (result === null) {
        if (Array.isArray(logs) && logs.length > 0) result = lang.Words.ConsoleOutput;
        else if (Array.isArray(warnings) && warnings.length > 0) result = lang.Words.WarningOutput;
        else if (Array.isArray(errors) && errors.length > 0) result = lang.Words.ErrorOutput;
      }
      embeds.push(
        Utils.setupMessage({
          configPath: lang.EvalResult,
          variables: [
            { searchFor: /{result}/g, replaceWith: result ? setTextLength(result.toString()) : lang.Words.None },
            { searchFor: /{executionTime}/g, replaceWith: executionTime },
          ],
        }).embeds[0]
      );
    }

    if (error !== null && error !== undefined) {
      embeds.push(
        Utils.setupMessage({
          configPath: lang.EvalExecutionError,
          variables: [
            Utils.createVariable("error-name", error.name),
            Utils.createVariable("error-message", setTextLength(error.message, 1024)),
            Utils.createVariable("error-stack", setTextLength(error.stack?.split("\n").slice(0, 3).join("\n"), 1024)),
          ],
        }).embeds[0]
      );
    }

    return { embeds };
  }

}
const addon = new Addon("SimpleEval", "1.0");
const addonConfig = {
  config: {
    AdminPass: "1234",
    "~34": "This is the private password used when giving eval perms.",
    Commands: {
      EvalManager: {
        CommandData: {
          Enabled: true,
          Name: "evalmanager",
          Usage: "evalmanager <channel|user> <list|set|remove|add>",
          Cooldown: 0,
          Permission: false,
          Description: "Manage evaluation channels and users.",
          DeleteCommand: false,
          Type: "addon",
          Arguments: [
            {
              Type: "sub command group", Name: "channel", Description: "Manage evaluation channels", Options: [
                { Type: "sub command", Name: "list", Description: "List all eval channels" },
                {
                  Type: "sub command", Name: "set", Description: "Set an eval channel", Options: [
                    { Type: "channel", Name: "channel", Description: "Channel to set", Required: true }
                  ]
                },
                {
                  Type: "sub command", Name: "delete", Description: "Remove an eval channel", Options: [
                    { Type: "channel", Name: "channel", Description: "Channel to remove", Required: true }
                  ]
                }
              ]
            },
            {
              Type: "sub command group", Name: "user", Description: "Manage eval users", Options: [
                { Type: "sub command", Name: "list", Description: "List all eval users" },
                {
                  Type: "sub command", Name: "add", Description: "Add an eval user", Options: [
                    { Type: "user", Name: "user", Description: "User to add", Required: true },
                    { Type: "string", Name: "password", Description: "The password in config", Required: true }
                  ]
                },
                {
                  Type: "sub command", Name: "remove", Description: "Remove an eval user", Options: [
                    { Type: "user", Name: "user", Description: "User to remove", Required: true }
                  ]
                }
              ]
            }
          ]
        },
        Usages: {
          user: {
            add: "evalmanager user add <user> <password>",
            remove: "evalmanager user remove <user>"
          },
          channel: {
            add: "evalmanager channel add <channel>",
            remove: "evalmanager channel remove <channel>"
          }
        }
      },
      Eval: {
        CommandData: {
          Enabled: true,
          Name: "eval",
          Usage: "eval <code>",
          Cooldown: 0,
          Permission: false,
          Description: "Evaluate code on the bot from discord.",
          DeleteCommand: true,
          Arguments: [
            { Type: "string", Name: "code", Description: "The code to be evaluated.", Required: true }
          ],
                Type: "addon"
        },
        Usage: "eval <code>"
      }
    }
  },
  lang: {
    Words: {
      None: "``none",
      WarningOutput: "[CONSOLE WARNINGS]",
      ConsoleOutput: "[CONSOLE OUTPUT]",
      ErrorOutput: "[CONSOLE ERORRS]"
    },
    Errors: {
      InvalidUsage: {
        Embeds: [
          {
            Title: "❌ Command Error",
            Description: "Invalid usage of the command. Please check the correct syntax and try again.",
            Color: "#e00736",
            Fields: [
              {
                Name: "📌 Correct Usage",
                Value: "```/{usage}```",
                Inline: false
              }
            ],
            Footer: "SimpleEval Addon • Command Error",
            FooterIcon: "https://i.imgur.com/ptTG24J.png"
          }
        ]
      },
      InvalidPass: {
        Embeds: [
          {
            Color: "e00736",
            Author: "{brand-name} • Invalid Password!",
            AuthorIcon: "{brand-logo}",
            Description: "in order to provide a secure way of handling eval, you must provide the password fron the ``SimpleEval`` config.\n\n> This prevents abuse and should be changed __atleast__ once.",
            Timestamp: true
          }
        ]
      },
      UserAlreadyAdded: {
        Embeds: [
          {
            Title: "⚠️ User Already Added",
            Description: "{user-mention} ``{user-username}`` is **already** in the SimpleEval permissions list.",
            Color: "#F1C40F", 
            Fields: [
              {
                Name: "🛑 Need to Remove?",
                Value: "You can remove this user using:\n```evalmanager user remove <user>```",
                Inline: false
              }
            ],
            Footer: "SimpleEval Addon • Permission System",
            FooterIcon: "https://i.imgur.com/ptTG24J.png"
          }
        ]
      },
      channelAlreadySet: {
        Embeds: [
          {
            Title: "⚠️ Channel Already Authorized",
            Description: "{channel-mention} (``{channel-name}-{channel-id}``) is **already** set as an evaluation channel.",
            Color: "#F1C40F",
            Fields: [
              {
                Name: "🔹 Need to Remove It?",
                Value: "You can delete this channel using:\n```evalmanager channel delete <channel>```",
                Inline: false
              }
            ],
            Footer: "SimpleEval Addon • Channel Management",
            FooterIcon: "https://i.imgur.com/ptTG24J.png"
          }
        ]
      },
      NoPermission: {
        Embeds: [
          {
            Title: "⛔ Permission Denied",
            Description: "You do **not** have permission to use SimpleEval.",
            Color: "#e00736", // Red to indicate restriction
            Fields: [
              {
                Name: "🔹 Required Permission",
                Value: "Only authorized users can execute evaluation commands.",
                Inline: false
              },
              {
                Name: "🔍 Need Access?",
                Value: "Contact a server administrator to request access.",
                Inline: false
              }
            ],
            Footer: "SimpleEval Addon • Access Restricted",
            FooterIcon: "https://i.imgur.com/ptTG24J.png"
          }
        ]
      }
    },

    EvalLogs: {
      Embeds: [
        {
          Title: "📝 Logs",
          Description: "```{logs}```",
          Color: "#3498DB",
        }
      ]
    },

    EvalWarnings: {
      Embeds: [
        {
          Title: "⚠️ Warnings",
          Description: "```{warnings}```",
          Color: "#F1C40F",
        }
      ]
    },

    EvalErrors: {
      Embeds: [
        {
          Title: "❌ Errors",
          Description: "```{errors}```",
          Color: "#e00736", 
        }
      ]
    },

    EvalResult: {
      Embeds: [
        {
          Title: "✅ Evaluation Result",
          Description: "Execution Time: `{executionTime}`",
          Color: "#2ECC71",
          Fields: [
            {
              Name: "📌 Output",
              Value: "```{result}```",
              Inline: false
            }
          ],
          Footer: "SimpleEval Addon",
          FooterIcon: "https://i.imgur.com/ptTG24J.png"
        }
      ]
    },

    EvalExecutionError: {
      Embeds: [
        {
          Title: "❌ Execution Error",
          Description: "Something went wrong during execution.",
          Color: "#e00736",
          Fields: [
            {
              Name: "🛑 Error Details",
              Value: "```yaml\n⚠️ Evaluation Error\n====================\nError Name: {error-name}\nMessage: {error-message}\n\n📜 Stack Trace:\n{error-stack}```",
              Inline: false
            }
          ],
          Footer: "SimpleEval Addon",
          FooterIcon: "https://i.imgur.com/ptTG24J.png"
        }
      ]
    },

    ChannelList: {
      Embeds: [
        {
          Title: "📜 Authorized Evaluation Channels",
          Description: "{channels}",
          Color: "#3498DB",
          Fields: [
            {
              Name: "🔹 What is this?",
              Value: "Below is a list of channels where **SimpleEval** is allowed. Users can execute bot-level code **automatically** in these channels.",
              Inline: false
            },
            {
              Name: "⚠️ Important Warning",
              Value: "Only trusted channels should have access to **SimpleEval** to prevent unauthorized execution.",
              Inline: false
            }
          ],
          Footer: "SimpleEval Addon • Channel List",
          FooterIcon: "https://i.imgur.com/ptTG24J.png"
        }
      ],
      Format: "``{index}.`` {channel-mention} (``{channel-name}-{channel-id}``)"
    },

    ChannelAdded: {
      Embeds: [
        {
          Title: "✅ Channel Added",
          Description: "{channel-mention} has been successfully **authorized** as an evaluation channel.",
          Color: "#2ECC71", 
          Fields: [
            {
              Name: "🔹 What does this mean?",
              Value: "Users can now execute **bot-level** code inside this channel **automatically** using SimpleEval.\n\n> Messages do not need to be sent as commands!",
              Inline: false
            }
          ],
          Footer: "SimpleEval Addon • Channel Management",
          FooterIcon: "https://i.imgur.com/ptTG24J.png"
        }
      ]
    },

    ChannelRemoved: {
      Embeds: [
        {
          Title: "❌ Channel Removed",
          Description: "{channel} has been successfully **removed** from the evaluation channels list.",
          Color: "#e00736",
          Fields: [
            {
              Name: "🔹 What does this mean?",
              Value: "Users can **no longer** execute bot-level code in this channel.",
              Inline: false
            }
          ],
          Footer: "SimpleEval Addon • Channel Management",
          FooterIcon: "https://i.imgur.com/ptTG24J.png"
        }
      ]
    },
    UserList: {
      Embeds: [
        {
          Title: "📜 Authorized Evaluation Users",
          Description: "{users}",
          Color: "#3498DB",
          Fields: [
            {
              Name: "🔹 What is this?",
              Value: "Below is a list of users with **evaluation permissions**. These users can execute bot-level code, so manage this list carefully.",
              Inline: false
            },
            {
              Name: "⚠️ Important Warning",
              Value: "Only trusted users should have access to **SimpleEval** as it allows code execution on the bot.",
              Inline: false
            }
          ],
          Footer: "SimpleEval Addon • User List",
          FooterIcon: "https://i.imgur.com/ptTG24J.png"
        }
      ],
      Format: "``{index}.`` {user-username} (``{user-id}``)"
    },
    UserAdded: {
      Private: true,
      Embeds: [
        {
          Author: "SimpleEval • Permission Update",
          Title: "Evaluation Access Granted",
          Description: "{user-mention} ``{user-username}`` has been successfully added to the SimpleEval permissions list.",
          Color: "#e00736",
          Fields: [
            {
              Name: "⚠️ Warning",
              Value: "This user can now execute **arbitrary code** as the bot. **Ensure you trust them completely.** Misuse of this permission can lead to security risks.",
              Inline: false
            }
          ],
          Footer: "SimpleEval Addon • Permission System",
          FooterIcon: "https://i.imgur.com/ptTG24J.png"
        }
      ]
    },
    UserRemoved: {
      Embeds: [
        {
          Title: "✅ Permission Revoked",
          Description: "{user-mention} ``{user-username}`` has been successfully removed from the SimpleEval evaluation users list.",
          Color: "#2ECC71", 
          Fields: [
            {
              Name: "ℹ️ Note",
              Value: "This user no longer has access to execute bot-level code. If they need access again, they must be re-added.",
              Inline: false
            }
          ],
          Footer: "SimpleEval Addon • Permission System",
          FooterIcon: "https://i.imgur.com/ptTG24J.png"
        }
      ]
    }
  }
};

const { lang, config } = addon.customConfig(addonConfig);

new Command({
  commandData: config.Commands.EvalManager.CommandData,
  commandConfig: {
    guildOnly: true,
    dmOnly: false,
    requiredPermissions: { bot: [], user: [] }
  },
  async InteractionRun(manager, interaction) {
    const subCommandGroup = interaction.options.getSubcommandGroup();
    const subCommand = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel("channel");
    const user = interaction.options.getMember("user");
    const password = interaction.options.getString("password");

    if (subCommandGroup === "channel") {
      if (subCommand === "list") {
        api.database.listEvalChannels(interaction.guild.id).then(channels => {
          const formattedChannels = [];

          for (const channel of channels) {
            try {
              const guildChannel = Utils.findChannel("text", interaction.guild, channel.id, false, true);

              if (!guildChannel) {
                api.database.removeEvalChannel(channel.id,);
                continue;
              }

              let msg = lang.ChannelList.Format;

              const variables = [
                ...Utils.channelVariables(guildChannel, "channel"),
                ...Utils.guildVariables(interaction.guild, "guild"),
                Utils.createVariable("index", formattedChannels.length + 1)
              ];

              variables.forEach(v => {
                msg = msg.replace(v.searchFor, v.replaceWith);
              });

              formattedChannels.push(msg);
            } catch (error) {
              logger.addon(`prefix{${addon.name}} Error processing channel ${channel.id}:`, error);
            }
          }

          interaction.reply(Utils.setupMessage({ configPath: lang.ChannelList, variables: [{ searchFor: /{channels}/g, replaceWith: formattedChannels.length >= 1 ? formattedChannels.join("\n") : `\`\`${lang.Words.None}\`\`` }] }));
        });
      } else if (subCommand === "set") {
        if (!channel) return interaction.reply(Utils.setupMessage({
          configPath: lang.Errors.InvalidUsage,
          variables: [
            Utils.createVariable("usage", config.Commands.EvalManager.Usages.channel.add)
          ]
        }));

        if (await api.database.getEvalChannel(channel.id, interaction.guild.id)) return interaction.reply(Utils.setupMessage({
          configPath: lang.Errors.channelAlreadySet,
          variables: Utils.channelVariables(channel, "channel")
        }));

        api.database.addEvalChannel(channel.id, interaction.guild.id);
        interaction.reply(Utils.setupMessage({ configPath: lang.ChannelAdded, variables: Utils.channelVariables(channel, "channel") }));

      } else if (subCommand === "delete") {
        if (!channel) return interaction.reply(Utils.setupMessage({
          configPath: lang.Errors.InvalidUsage,
          variables: [
            Utils.createVariable("usage", config.Commands.EvalManager.Usages.channel.remove)
          ]
        }));
        api.database.removeEvalChannel(channel.id);
        interaction.reply(Utils.setupMessage({ configPath: lang.ChannelRemoved, variables: [{ searchFor: /{channel}/g, replaceWith: channel.toString() }] }));
      }
    } else if (subCommandGroup === "user") {
      if (subCommand === "list") {
        api.database.getEvalUsers(interaction.guild.id).then((users) => {
          const formattedUsers = [];

          for (const user of users) {
            try {
              const guildMember = Utils.findMember(interaction.guild, user.id);

              if (!guildMember) {
                api.database.removeEvalUser(user.id, user.guildId);
                continue; // Skip this user if they are not found
              }

              let msg = lang.UserList.Format;

              const variables = [
                ...Utils.userVariables(guildMember, "user"),
                ...Utils.guildVariables(interaction.guild, "guild"),
                Utils.createVariable("index", formattedUsers.length + 1)
              ];

              variables.forEach(v => {
                msg = msg.replace(v.searchFor, v.replaceWith);
              });

              formattedUsers.push(msg);
            } catch (error) {
              console.error(`Error processing user ${user.id}:`, error);
            }
          }

          interaction.reply(
            Utils.setupMessage({
              configPath: lang.UserList,
              variables: [
                {
                  searchFor: /{users}/g,
                  replaceWith: formattedUsers.length >= 1 ? formattedUsers.join("\n") : `\`\`${lang.Words.None}\`\``
                }
              ]
            })
          );
        })
      } else if (subCommand === "add") {

        if (!user || !password || user.user.bot) return interaction.reply(Utils.setupMessage({
          configPath: lang.Errors.InvalidUsage,
          variables: [
            Utils.createVariable("usage", config.Commands.EvalManager.Usages.user.add)
          ]
        }));

        if (password !== config.AdminPass) return interaction.reply(Utils.setupMessage({
          configPath: lang.Errors.InvalidPass,
        }));

        if (await api.database.getEvalUser(user.id, interaction.guild.id)) return interaction.reply(Utils.setupMessage({
          configPath: lang.Errors.UserAlreadyAdded,
          variables: Utils.userVariables(user, "user")
        }));

        api.database.addEvalUser(user.id, interaction.guild.id).then(() => {
          interaction.reply(Utils.setupMessage({ configPath: lang.UserAdded, variables: Utils.userVariables(user, "user") }));
        })
      } else if (subCommand === "remove") {
        if (!user) return interaction.reply(Utils.setupMessage({
          configPath: lang.Errors.InvalidUsage,
          variables: [
            Utils.createVariable("usage", config.Commands.EvalManager.Usages.user.remove)
          ]
        }));

        api.database.removeEvalUser(user.id, interaction.guild.id);
        interaction.reply(Utils.setupMessage({ configPath: lang.UserRemoved, variables: Utils.userVariables(user, "user") }));
      }
    }
  }
});

new Command({
  commandData: config.Commands.Eval.CommandData,
  commandConfig: {
    guildOnly: true,
    dmOnly: false,
    requiredPermissions: { bot: [], user: [] }
  },
  async InteractionRun(manager, interaction) {
    const code = interaction.options.getString("code", true);
    if (!code) return interaction.reply({
      configPath: lang.Errors.InvalidUsage,
      variables: [Utils.createVariable("usage", config.Commands.Eval.Usage)]
    })

    if (!(await api.database.getEvalUser(interaction.user.id, interaction.guild.id))) return interaction.reply(Utils.setupMessage({
      configPath: lang.Errors.NoPermission,
      variables: [
        ...Utils.userVariables(interaction.member, "user")
      ]
    }))

    await interaction.deferReply({ ephemeral: true })

    api.Eval(code, {
      manager,
      interaction,
      guild: interaction.guild,
      channel: interaction.channel,
      Utils,
      EventListener,
      Command,
      logger,
    }).then(async (res) => {
      if (!res) return interaction.followUp(`An unknown error Occured!`);
      interaction.followUp(api.formatEvalEmbeds(res))
    })
  }
});

new EventListener("messageCreate", async (manager, message) => {
  if (!message.guild || !message.channel.isTextBased()) return;
  if ((!message.content && message.attachments.size <= 0) || message.author.bot) return;

  if (await api.database.getEvalChannel(message.channel.id) && await api.database.getEvalUser(message.author.id, message.guild.id)) {
    let code = message.content.trim();

    const attachment = message.attachments.find(att => att.name.endsWith('.js') || att.name.endsWith('.txt'));

    if (attachment) {
        try {
            const response = await fetch(attachment.url);
            code = await response.text();
        } catch (error) {
            console.error("Failed to fetch attachment:", error);
            return message.reply("An error occurred while fetching the attachment.");
        }
    }

    api.Eval(code, {
      manager,
      message,
      guild: message.guild,
      channel: message.channel,
      Utils: Utils,
      EventListener,
      Command,
      logger: Utils.logger,
    }).then(async (res) => {
      if (!res) return message.reply(`An unknown error Occured!`);

      message.reply(api.formatEvalEmbeds(res))
    })
  }
})

addon.setLog(`prefix{cyan{${addon.name}}} has been loaded! Version: bold{v${addon.version}}`);

// Declare the developer information according to the addon
addon.setDeveloper("59L")

// Export the addon for use
export default addon;
