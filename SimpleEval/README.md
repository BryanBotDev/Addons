# SimpleEval Addon for BryanBot

## Overview
SimpleEval is a powerful BryanBot addon designed to allow administrators and authorized users to execute JavaScript code within Discord. This addon provides a secure and flexible environment for evaluating code while maintaining strict permissions to prevent misuse.

## Features
- **Secure Code Execution**: Restricts evaluation access to authorized users and channels.
- **Permission Management**: Add or remove users and channels from the evaluation list.
- **Comprehensive Logging**: Logs execution results, errors, and warnings.
- **Support for Attachments**: Execute JavaScript from `.js` or `.txt` files attached to messages.
- **Optimized Formatting**: Returns outputs as embedded messages for better readability.
- **Execution Time Tracking**: Measures execution time to optimize performance.

## Installation Guide
### Installation Steps
1. **Download the SimpleEval.js file** from the repository above.
2. **Move the file** to the `./data/addons` directory in your BryanBot installation.
3. Restart BryanBot to load the addon.

## Commands
### 1. Manage Evaluation Permissions
#### `evalmanager channel list`
Lists all authorized evaluation channels.

#### `evalmanager channel set <channel>`
Adds a channel to the evaluation list, allowing users to execute code within it.

#### `evalmanager channel delete <channel>`
Removes a channel from the evaluation list.

#### `evalmanager user list`
Lists all users with evaluation permissions.

#### `evalmanager user add <user> <password>`
Adds a user to the evaluation list. Requires the admin password from the configuration file.

#### `evalmanager user remove <user>`
Removes a user from the evaluation list.

### 2. Execute Code
#### `eval <code>`
Executes JavaScript code within the bot and returns the output.

### 3. Message-Based Execution (Auto-Eval)
- If a user with evaluation permissions sends a message in an authorized channel, the bot will automatically evaluate the message as JavaScript code.
- Users can also upload `.js` or `.txt` files containing code, which the bot will execute.

## Security Measures
- **Password Protection**: Users must enter an admin password to gain execution permissions.
- **Restricted Access**: Only specified users and channels can run evaluations.
- **Sanitization**: Limits execution risks by preventing unauthorized function calls.

## Configuration
The configuration file (`SimpleEval.yml`) allows customization of:
- Admin password
- Default evaluation channels
- Evaluation logs and output formatting

## Troubleshooting
- Ensure the bot has the correct permissions.
- Check if the user or channel is authorized.
- Verify the admin password if access is denied.
- Restart the bot if changes are not taking effect.

## Credits
Developed by **[59L](https://github.com/59L)** as an official BryanBot addon.
