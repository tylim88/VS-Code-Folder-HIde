import * as vscode from 'vscode'
import fs from 'fs'
import upath from 'upath'
import parseJson from 'parse-json'
import os from 'os'
import open from 'open'

const getGlobalConfig = () => {
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
    const data = fs.readFileSync(upath.toUnix(globalSettingsPath), 'utf-8')
    return {
        config: parseJson(data)['files.exclude'] || {},
        path: globalSettingsPath,
    }
}

const hide = (global: boolean) => (uri: vscode.Uri) => {
    let config: Record<string, unknown> = {}

    const filePath = uri.path
    let configPath = ''
    let result = ''

    // ! vscode.workspace.getConfiguration() is unreliable

    try {
        if (global) {
            const result = getGlobalConfig()
            config = result.config
            configPath = result.path
        } else {
            let workspacePath = vscode.workspace.workspaceFolders![0].uri.path

            workspacePath =
                workspacePath[0] === '/'
                    ? workspacePath.substring(1)
                    : workspacePath

            configPath = upath.toUnix(
                upath.join(workspacePath, '.vscode/settings.json')
            )
            if (fs.existsSync(configPath)) {
                const data = fs.readFileSync(configPath, 'utf-8')
                config = parseJson(data)['files.exclude'] || {}
            } else {
                const result = getGlobalConfig()
                config = result.config
                configPath = result.path
            }
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
    } catch (e) {
        if ((e as any)?.name === 'JSONError') {
            vscode.window.showErrorMessage(
                `Please make sure ${configPath} is a valid json file. Example: remove any comment from your json file`,
                { modal: true }
            )
        } else {
            const title = 'Report Issue'
            vscode.window
                .showErrorMessage(
                    `Error: Please report the issue on Github.
                
Error Message:
${JSON.stringify(e)}`,
                    { modal: true },
                    title
                )
                .then((selection) => {
                    if (selection === title) {
                        open(
                            'https://github.com/tylim88/VS-Code-Folder-HIde/issues/new'
                        )
                    }
                })
        }
    }
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
