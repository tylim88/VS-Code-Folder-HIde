import * as vscode from 'vscode'
import fs from 'fs'
import upath from 'upath'
import parseJson from 'parse-json'
import os from 'os'
import open from 'open'

const getRelativePath = (uri: vscode.Uri) => {
    const workspacePath = upath.toUnix(
        vscode.workspace.workspaceFolders![0].uri.fsPath
    )
    const fullPath = upath.toUnix(uri.path)

    const length = fullPath
        .toLowerCase()
        .substring(fullPath.toLowerCase().indexOf(workspacePath.toLowerCase()))
        .split(workspacePath.toLowerCase())
        .join('').length

    const relativePath =
        length === 0
            ? ''
            : fullPath.slice(
                  -fullPath
                      .toLowerCase()
                      .substring(
                          fullPath
                              .toLowerCase()
                              .indexOf(workspacePath.toLowerCase())
                      )
                      .split(workspacePath.toLowerCase())
                      .join('').length
              )

    return relativePath[0] === '/' ? relativePath.substring(1) : relativePath
}

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
        configPath: globalSettingsPath,
    }
}

const hide = (isGlobal: boolean) => async (uri: vscode.Uri) => {
    let config: Record<string, unknown> = {}

    let configPath: string | null = null
    const relativeFilePath = getRelativePath(uri)
    const splittedRelativeFilePath = relativeFilePath.split('/')
    const pathSelection = [
        relativeFilePath,
        '**/'.concat(
            splittedRelativeFilePath[splittedRelativeFilePath.length - 1]
        ),
    ]
    const excludePath =
        relativeFilePath === ''
            ? '**/'
            : await vscode.window.showQuickPick(pathSelection)

    if (excludePath) {
        try {
            if (isGlobal) {
                // ! vscode.workspace.getConfiguration() is unreliable

                const globalConfig = getGlobalConfig()
                config = globalConfig.config
                configPath = globalConfig.configPath
            } else {
                let workspacePath =
                    vscode.workspace.workspaceFolders![0].uri.path

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
                    const globalConfig = getGlobalConfig()
                    config = globalConfig.config
                    configPath = globalConfig.configPath
                }
            }

            const newExclude = {
                ...config,
                [excludePath]: true,
            }

            vscode.workspace
                .getConfiguration()
                .update('files.exclude', newExclude, isGlobal)
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
