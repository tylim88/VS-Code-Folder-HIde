import * as vscode from 'vscode'
import convertPath from '@stdlib/utils-convert-path'

export function activate(context: vscode.ExtensionContext) {
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
            await vscode.commands.executeCommand(
                'workbench.action.openWorkspaceSettings',
                { query: 'files.exclude' }
            )
        }
    )

    context.subscriptions.push(hide, unhide)
}

export function deactivate() {}
