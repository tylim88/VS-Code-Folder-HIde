// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import convertPath from '@stdlib/utils-convert-path'
// @ts-expect-error
import ks from 'node-key-sender'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "folder-lock" is now active!')

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json

    const hide = vscode.commands.registerCommand(
        'folder-hide.hide',
        (uri: vscode.Uri) => {
            const config = vscode.workspace.getConfiguration()

            const result = uri.path.split(
                convertPath(
                    vscode.workspace.workspaceFolders![0].uri.fsPath,
                    'mixed'
                )
            )
            const newExclude = {
                ...(config.get('files.exclude') || {}),
                ['**' + result[result.length - 1]]: true,
            }

            config.update('files.exclude', newExclude, false)
        }
    )

    const unhide = vscode.commands.registerCommand(
        'folder-hide.unhide',
        async () => {
            // Get the configuration target for the workspace
            const configTarget = vscode.ConfigurationTarget.Workspace
            // Open the workspace 'files.exclude' settings in a new tab
            await vscode.commands.executeCommand(
                'workbench.action.openWorkspaceSettings',
                { query: 'files.exclude' }
            )
        }
    )

    context.subscriptions.push(hide, unhide)
}

// This method is called when your extension is deactivated
export function deactivate() {}
