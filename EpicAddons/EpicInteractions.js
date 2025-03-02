import { Events, BaseInteraction } from "discord.js";
import { Addon } from "../../src/Modules/Structures/Handlers/Addons.js";
import { EventListener } from "../../src/Modules/Structures/Handlers/Events.js";
import Utils from "../../src/Modules/Utils.js";
import chalk from "chalk";
import { BryanBot } from "../../src/Modules/Structures/BryanBot.js";

const addon = new Addon("EpicInteractions", "v1.0.0"),
  addonConfig = {
    Buttons: {
      "~01": "Welcome in button configs!",
      "~02": "This is the place, where you can create your own buttons",
      "~03": "Follow this example end create your own ;-)",
      Buttons: [
        {
          "~04": "Button name",
          Name: "button",
          "~05": "Button ID",
          "~06": "Lowercase + No spaces",
          CustomID: "button",
          "~07": "Actions, which will be executed after interaction",
          Actions: [
            {
              Type: "Preset",
              Action: "Send",
              Preset: "example",
            },
            {
              Type: "Preset",
              Action: "Send",
              Preset: "example2",
              Channel: "960498357384663041",
            },
            {
              Type: "Preset",
              Action: "Edit",
              NewPreset: "example2",
            },
            {
              Type: "Role",
              Action: "Give",
              Role: "User",
            },
            {
              Type: "Role",
              Action: "Switch",
              Role: "Client",
            },
            {
              Type: "Role",
              Action: "Remove",
              Role: "Tester",
              User: "simonb50",
            },
          ],
          "~08": "Interaction reply",
          Reply: {
            Private: true,
            Preset: "example",
          },
        },
      ],
    },
    Menus: {
      "~01": "Welcome in menu configs!",
      "~02": "This is the place, where you can create your own menus",
      "~03": "Follow this example end create your own ;-)",
      Menus: [
        {
          "~04": "Menu name",
          Name: "menu",
          "~05": "Menu ID",
          "~06": "Lowercase + No spaces",
          CustomID: "menu",
          "~07": "Menu options",
          Options: [
            {
              Name: "option1",
              Actions: [
                {
                  Type: "Preset",
                  Action: "send",
                  Preset: "example",
                },
              ],
            },
            {
              Name: "option2",
              Actions: [
                {
                  Type: "Preset",
                  Action: "edit",
                  NewPreset: "example2",
                },
              ],
            },
            {
              Name: "option3",
              Actions: [
                {
                  Type: "Role",
                  Action: "Give",
                  Role: "User",
                },
              ],
            },
            {
              Name: "option4",
              Actions: [
                {
                  Type: "Role",
                  Action: "Remove",
                  Role: "Tester",
                  User: "simonb50",
                },
              ],
            },
          ],
          "~08": "Interaction reply",
          Reply: {
            Private: true,
            Preset: "example",
          },
        },
      ],
    },
  };

/** @type {addonConfig} */
const { Buttons, Menus } = addon.customConfig(addonConfig);

const Logger = {
  Banner: chalk.hex("#A200FF").bold("[EpicInteractions] "),
  logInfo: (...i) => Utils.logger.info(Logger.Banner, ...i),
  logWarning: (...w) => Utils.logger.warn(Logger.Banner, ...w),
  logError: (...e) => Utils.logger.error(Logger.Banner, ...e),
};

addon
  .setDeveloper("SimonB50")
  .setDiscord("https://discord.gg/SgUjx2KJUd")
  .setDocs("https://simonb50.gitbook.io/docs/");

addon.setExecute(async (manager) => {
  const { runAction } = await import("./EpicScript.js");
  const { getPreset } = await import("./EpicPresets.js");

  new EventListener(
    Events.InteractionCreate,
    /**
     * @param {BryanBot} manager
     * @param {BaseInteraction} interaction
     */
    async (manager, interaction) => {
      switch (true) {
        case interaction.isButton():
          const button = Buttons.Buttons.find(
            (button) => button.CustomID === interaction.customId
          );
          if (!button) return;
          for (const action of button.Actions) {
            try {
              runAction(
                action,
                interaction.member,
                interaction.channel,
                interaction.message
              );
            } catch (error) {
              Logger.logError(error);
            }
          }
          if (button.Reply && button.Reply.Preset) {
            const preset = getPreset(button.Reply.Preset);
            if (!preset)
              throw new Error(`Preset ${button.Reply.Preset} was not found!`);
            interaction.reply({
              ...Utils.setupMessage({
                configPath: preset.Message,
                variables: [
                  ...Utils.guildVariables(interaction.guild),
                  ...Utils.channelVariables(interaction.channel),
                  ...Utils.userVariables(interaction.member),
                  ...Utils.botVariables(manager),
                ],
              }),
              ephemeral: button.Reply.Private || false,
            });
          } else {
            interaction.deferUpdate();
          }
          break;
        case interaction.isStringSelectMenu():
          const menu = Menus.Menus.find(
            (menu) => menu.CustomID === interaction.customId
          );
          if (!menu) return;
          for (const menuOption of interaction.values) {
            const option = menu.Options.find(
              (option) => option.Name === menuOption
            );
            if (!option) return;
            for (const action of option.Actions) {
              try {
                runAction(
                  action,
                  interaction.member,
                  interaction.channel,
                  interaction.message
                );
              } catch (error) {
                Logger.logError(error);
              }
            }
          }
          if (menu.Reply && menu.Reply.Preset) {
            const preset = getPreset(menu.Reply.Preset);
            if (!preset)
              throw new Error(`Preset ${menu.Reply.Preset} was not found!`);
            interaction.reply({
              ...Utils.setupMessage({
                configPath: preset.Message,
                variables: [
                  ...Utils.guildVariables(interaction.guild),
                  ...Utils.channelVariables(interaction.channel),
                  ...Utils.userVariables(interaction.member),
                  ...Utils.botVariables(manager),
                ],
              }),
              ephemeral: menu.Reply.Private || false,
            });
          } else {
            interaction.deferUpdate();
          }
          break;
      }
    }
  );
  Logger.logInfo(`Addon loaded! Author: ${chalk.bold("Simonb50")}`);
});

export default addon;
