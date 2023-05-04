import * as vscode from 'vscode'
import fs from 'fs'
import upath from 'upath'
import parseJson from 'parse-json'
import os from 'os'

const hide = (global: boolean) => (uri: vscode.Uri) => {
    let config: Record<string, unknown> = {}

    const filePath = uri.path
    let result = ''

    let workspacePath = vscode.workspace.workspaceFolders![0].uri.path

    workspacePath =
        workspacePath[0] === '/' ? workspacePath.substring(1) : workspacePath

    // ! vscode.workspace.getConfiguration() is unreliable

    try {
        if (global) {
            const platform = process.platform
            let globalSettingsPath = ''
            if (platform === 'darwin') {
                globalSettingsPath = upath.join(
                    os.homedir(),
                    'Library/Application\\ Support/Code/User/settings.json'
                )
            } else if (platform === 'win32') {
                globalSettingsPath = upath.join(
                    process.env.APPDATA,
                    'Code\\User\\settings.json'
                )
            } else if (platform === 'linux') {
                globalSettingsPath = upath.join(
                    os.homedir(),
                    '.config/Code/User/settings.json'
                )
            }
            const data = fs.readFileSync(
                upath.toUnix(globalSettingsPath),
                'utf-8'
            )
            config = parseJson(data)['files.exclude'] || {}
            console.log({ data, config })
        } else {
            const data = fs.readFileSync(
                upath.toUnix(
                    upath.join(workspacePath, '.vscode/settings.json')
                ),
                'utf-8'
            )
            config = parseJson(data)['files.exclude'] || {}
        }
    } catch (e) {
        vscode.window.showErrorMessage(
            `Error: Please report the issue on Github.

Error Message:
${JSON.stringify(e)}
            `,
            { modal: true }
        )
    }

    for (let i = filePath.length - 1; i > 0; i--) {
        const char = filePath[i]
        if (char === '/' || char === '\\') {
            break
        } else {
            result = char + result
        }
    }

    const newExclude = {
        ...config,
        ['**/' + result]: true,
    }

    vscode.workspace
        .getConfiguration()
        .update('files.exclude', newExclude, global)
}

export function activate(context: vscode.ExtensionContext) {
    const hideFolder = vscode.commands.registerCommand(
        'folder-hide',
        hide(false)
    )
    const hideFolderGlobal = vscode.commands.registerCommand(
        'folder-hide-global',
        hide(true)
    )
    const hideFile = vscode.commands.registerCommand('file-hide', hide(false))

    const hideFileGlobal = vscode.commands.registerCommand(
        'file-hide-global',
        hide(true)
    )

    const unhide = vscode.commands.registerCommand('unhide', async () => {
        await vscode.commands.executeCommand(
            'workbench.action.openWorkspaceSettings',
            { query: 'files.exclude' }
        )
    })
    const unhideGlobal = vscode.commands.registerCommand(
        'unhide-global',
        async () => {
            await vscode.commands.executeCommand(
                'workbench.action.openSettings',
                {
                    query: 'files.exclude',
                }
            )
        }
    )

    context.subscriptions.push(
        hideFolder,
        hideFolderGlobal,
        hideFile,
        hideFileGlobal,
        unhide,
        unhideGlobal
    )
}

export function deactivate() {}
