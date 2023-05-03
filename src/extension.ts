import * as vscode from 'vscode'

const hide = (uri: vscode.Uri) => {
    const config = vscode.workspace.getConfiguration()
    const path = uri.path
    let result = ''

    for (let i = path.length - 1; i > 0; i--) {
        const char = path[i]
        if (char === '/' || char === '\\') {
            break
        } else {
            result = char + result
        }
    }

    const newExclude = {
        ...(config.get('files.exclude') as {}),
        ['**/' + result]: true,
    }

    config.update('files.exclude', newExclude, false)
}

export function activate(context: vscode.ExtensionContext) {
    const hideFolder = vscode.commands.registerCommand('folder-hide.hide', hide)
    const hideFile = vscode.commands.registerCommand('file-hide.hide', hide)

    const unhide = vscode.commands.registerCommand(
        'folder-hide.unhide',
        async () => {
            await vscode.commands.executeCommand(
                'workbench.action.openWorkspaceSettings',
                { query: 'files.exclude' }
            )
        }
    )

    context.subscriptions.push(hideFolder, hideFile, unhide)
}

export function deactivate() {}
