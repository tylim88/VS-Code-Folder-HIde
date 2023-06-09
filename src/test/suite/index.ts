import * as path from 'path'
import * as Mocha from 'mocha'
import * as glob from 'glob'

export function run(): Promise<void> {
    // Create the mocha test
    // @ts-expect-error
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
    })

    const testsRoot = path.resolve(__dirname, '..')

    return new Promise((c, e) => {
        // @ts-expect-error
        glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
            if (err) {
                return e(err)
            }

            // Add files to the test suite
            // @ts-expect-error
            files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)))

            try {
                // Run the mocha test
                // @ts-expect-error
                mocha.run((failures) => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`))
                    } else {
                        c()
                    }
                })
            } catch (err) {
                console.error(err)
                e(err)
            }
        })
    })
}
