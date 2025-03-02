import { Collection, GuildChannel, GuildMember, Message } from "discord.js";
import { Addon } from "../../src/Modules/Structures/Handlers/Addons.js";
import Utils from "../../src/Modules/Utils.js";
import chalk from "chalk";

const addon = new Addon("EpicScript", "v1.0.0"),
  addonConfig = {
    Info: {
      "~00": "This addon is a dependency for all of EpicAddons.",
      "~01":
        "It handles actions used by addons like EpicInteractions and EpicTags.",
      "~02": "This addon should not be deleted.",
    },
  };

/** @type {addonConfig} */
const { Info } = addon.customConfig(addonConfig);

const Logger = {
  Banner: chalk.hex("#A200FF").bold("[EpicScript] "),
  logInfo: (...i) => Utils.logger.info(Logger.Banner, ...i),
  logWarning: (...w) => Utils.logger.warn(Logger.Banner, ...w),
  logError: (...e) => Utils.logger.error(Logger.Banner, ...e),
};

addon
  .setDeveloper("SimonB50")
  .setDiscord("https://discord.gg/SgUjx2KJUd")
  .setDocs("https://simonb50.gitbook.io/docs/");

const ActionArgument = {
  name: String,
  type: "text" | "number" | "role" | "member" | "channel",
  required: Boolean,
};
const ActionConfig = {
  type: String,
  action: String,
  arguments: [ActionArgument],
  requirements: {
    user: Boolean,
    channel: Boolean,
    message: Boolean,
  },
  /**
   * Function to run when action is executed
   * @param {GuildMember | null} actionUser
   * @param {GuildChannel | null} actionChannel
   * @param {Message | null} actionMessage
   * @param {*} actionArguments
   */
  actionRun: (actionUser, actionChannel, actionMessage, actionArguments) => {},
};
const ActionData = {
  Type: String,
  Action: String,
  [String]: "*",
};

// Default actions
/** @type {ActionConfig[]} */
const defaultActions = [
  {
    type: "Role",
    action: "Give",
    arguments: [
      {
        name: "Role",
        type: "role",
        required: true,
      },
      {
        name: "User",
        type: "member",
        required: false,
      },
    ],
    requirements: {
      user: true,
      channel: false,
      message: false,
    },
    actionRun: async (
      actionUser,
      actionChannel,
      actionMessage,
      actionArguments
    ) => {
      const role = actionArguments.find((arg) => arg.name === "Role").value;
      const user =
        actionArguments.find((arg) => arg.name === "User").value || actionUser;
      if (!user)
        throw new Error(
          "Role:Give action requires either User argument or actionUser."
        );
      user.roles.add(role);
    },
  },
  {
    type: "Role",
    action: "Remove",
    arguments: [
      {
        name: "Role",
        type: "role",
        required: true,
      },
      {
        name: "User",
        type: "member",
        required: false,
      },
    ],
    requirements: {
      user: true,
      channel: false,
      message: false,
    },
    actionRun: async (
      actionUser,
      actionChannel,
      actionMessage,
      actionArguments
    ) => {
      const role = actionArguments.find((arg) => arg.name === "Role").value;
      const user =
        actionArguments.find((arg) => arg.name === "User").value || actionUser;
      if (!user)
        throw new Error(
          "Role:Remove action requires either User argument or actionUser."
        );
      user.roles.remove(role);
    },
  },
  {
    type: "Role",
    action: "Switch",
    arguments: [
      {
        name: "Role",
        type: "role",
        required: true,
      },
      {
        name: "User",
        type: "member",
        required: false,
      },
    ],
    requirements: {
      user: true,
      channel: false,
      message: false,
    },
    actionRun: async (
      actionUser,
      actionChannel,
      actionMessage,
      actionArguments
    ) => {
      const role = actionArguments.find((arg) => arg.name === "Role").value;
      const user =
        actionArguments.find((arg) => arg.name === "User").value || actionUser;
      if (!user)
        throw new Error(
          "Role:Switch action requires either User argument or actionUser."
        );
      if (Utils.hasPermission([role.name], user)) {
        user.roles.remove(role);
      } else {
        user.roles.add(role);
      }
    },
  },
];

/** @type {Collection<string, ActionConfig>} */
const epicActions = new Collection();

/**
 * Register new EpicAction
 * @param {ActionConfig} action
 * @returns {void}
 */
const registerAction = (action) => {
  if (!action || !action?.type || !action?.action || !action?.actionRun)
    throw new Error(
      'Invalid input for action. Missing "type", "action" or "actionRun"'
    );
  epicActions.set(`${action.type}:${action.action}`.toLowerCase(), action);
};

/**
 * Get EpicAction data
 * @param {string} actionType
 * @param {string} actionName
 * @returns {ActionConfig}
 */
const getAction = (actionType, actionName) => {
  if (!actionType || !actionName)
    throw new Error("Invalid input for action type/name.");
  return epicActions.get(`${actionType}:${actionName}`.toLowerCase());
};

/**
 * Get all EpicActions by type
 * @param {string} actionType
 * @returns {Collection<string, ActionConfig>}
 */
const getActionsByType = (actionType) => {
  if (!actionType) throw new Error("Invalid input for action type.");
  return epicActions.filter(
    (action) => action.type === actionType.toLowerCase()
  );
};

/**
 * Execute EpicAction with given data
 * @param {ActionData} actionData
 * @param {GuildMember | null} actionUser
 * @param {GuildChannel | null} actionChannel
 * @param {Message | null} actionMessage
 * @returns {void}
 */
const runAction = (actionData, actionUser, actionChannel, actionMessage) => {
  // Get action
  if (!actionData.Type || !actionData.Action)
    throw new Error("Invalid input for type/action name.");
  const actionToRun = getAction(actionData.Type, actionData.Action);
  if (!actionToRun)
    throw new Error(
      `Action with type ${actionData.Type} and name ${actionData.Action} doesn't exist.`
    );

  // Check if requirements are met
  if (actionToRun.requirements.user && !actionUser)
    throw new Error(`Action ${type}:${action} requires user to run.`);
  if (actionToRun.requirements.channel && !actionChannel)
    throw new Error(`Action ${type}:${action} requires channel to run.`);
  if (actionToRun.requirements.message && !actionMessage)
    throw new Error(`Action ${type}:${action} requires message to run.`);

  // Parse arguments
  const parsedArguments = [];
  for (const argument of actionToRun.arguments) {
    const actionArgument = actionData[argument.name];
    if (!actionArgument) {
      if (argument.required)
        throw new Error(
          `Action ${actionToRun.type}:${actionToRun.action} requires argument ${argument.name}.`
        );
      else {
        parsedArguments.push({
          name: argument.name,
          value: undefined,
        });
        continue;
      }
    }

    switch (argument.type) {
      case "text": {
        parsedArguments.push({
          name: argument.name,
          value: actionArgument,
        });
        break;
      }
      case "number": {
        const parsedNumber = parseInt(actionArgument);
        if (isNaN(parsedNumber))
          throw new Error(
            `Action ${actionToRun.type}:${actionToRun.action} requires argument ${argument.name} to be a number.`
          );
        parsedArguments.push({
          name: argument.name,
          value: parsedNumber,
        });
        break;
      }
      case "role": {
        const parsedRole = Utils.findRole(actionUser.guild, actionArgument);
        if (!parsedRole)
          throw new Error(
            `Action ${actionToRun.type}:${actionToRun.action} requires argument ${argument.name} to be a role.`
          );
        parsedArguments.push({
          name: argument.name,
          value: parsedRole,
        });
        break;
      }
      case "member": {
        const parsedMember = Utils.findMember(actionUser.guild, actionArgument);
        if (!parsedMember)
          throw new Error(
            `Action ${actionToRun.type}:${actionToRun.action} requires argument ${argument.name} to be a member.`
          );
        parsedArguments.push({
          name: argument.name,
          value: parsedMember,
        });
        break;
      }
      case "channel": {
        const parsedChannel = actionChannel.guild.channels.cache.find(
          (ch) => ch.name === actionArgument || ch.id === actionArgument
        );
        if (!parsedChannel)
          throw new Error(
            `Action ${actionToRun.type}:${actionToRun.action} requires argument ${argument.name} to be a channel.`
          );
        parsedArguments.push({
          name: argument.name,
          value: parsedChannel,
        });
        break;
      }
      default: {
        throw new Error(
          `Action ${actionToRun.type}:${actionToRun.action} has invalid argument type ${argument.type}.`
        );
      }
    }
  }
  return actionToRun.actionRun(
    actionUser,
    actionChannel,
    actionMessage,
    parsedArguments
  );
};

addon.setExecute(async (manager) => {
  // Register default actions
  for (const action of defaultActions) {
    registerAction(action);
  }
  Logger.logInfo(`Addon loaded! Author: ${chalk.bold("Simonb50")}`);
});

export default addon;
export {
  ActionConfig,
  ActionArgument,
  registerAction,
  getAction,
  getActionsByType,
  runAction,
};
