import { downloadTemplate } from 'giget'
import color from 'picocolors'
import * as p from '@clack/prompts'
import { rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { installDependencies, detectPackageManager } from 'nypm'

const starters = [
  {
    label: 'Default',
    value: 'maizzle/maizzle',
    path: 'gh:maizzle/maizzle#master',
  },
  {
    label: 'v4.x',
    value: 'maizzle/starter-v4',
    path: 'gh:maizzle/starter-v4#master',
  },
  {
    label: 'API',
    value: 'maizzle/starter-api',
    path: 'gh:maizzle/starter-api#main',
  },
  {
    label: 'AMP4Email',
    value: 'maizzle/starter-amp4email',
    path: 'gh:maizzle/starter-amp4email#master',
  },
  {
    label: 'Liquid',
    value: 'maizzle/starter-liquid',
    path: 'gh:maizzle/starter-liquid#master',
  },
  {
    label: 'Mailchimp',
    value: 'maizzle/starter-mailchimp',
    path: 'gh:maizzle/starter-mailchimp#main',
  },
  {
    label: 'Markdown',
    value: 'maizzle/starter-markdown',
    path: 'gh:maizzle/starter-markdown#main',
  },
  {
    label: 'RSS',
    value: 'maizzle/starter-rss',
    path: 'gh:maizzle/starter-rss#master',
  },
  {
    label: 'WordPress API',
    value: 'maizzle/starter-wordpress-api',
    path: 'gh:maizzle/starter-wordpress-api#master',
  },
]

export async function main() {
  const args = process.argv.slice(2)
  const positional = []
  let installFlag = false
  let pmFlag

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-i' || args[i] === '--install') {
      installFlag = true
    } else if (args[i] === '--pm' && args[i + 1]) {
      pmFlag = args[++i]
    } else if (args[i].startsWith('--pm=')) {
      pmFlag = args[i].split('=')[1]
    } else if (!args[i].startsWith('-')) {
      positional.push(args[i])
    }
  }

  let project

  if (positional.length > 0) {
    const starterInput = positional[0]
    const dirInput = positional[1] || `./${starterInput.split('/').pop().replace('.git', '')}`

    if (existsSync(dirInput)) {
      console.error(`Error: directory ${dirInput} already exists.`)
      process.exit(1)
    }

    project = {
      starter: starterInput,
      path: dirInput,
      install: installFlag,
      pm: pmFlag || 'npm',
    }
  } else {
    console.clear()

    console.log(`\n                           ░██                      ░██
                                                    ░██
░█████████████   ░██████   ░██░█████████ ░█████████ ░██  ░███████
░██   ░██   ░██       ░██  ░██     ░███       ░███  ░██ ░██    ░██
░██   ░██   ░██  ░███████  ░██   ░███       ░███    ░██ ░█████████
░██   ░██   ░██ ░██   ░██  ░██ ░███       ░███      ░██ ░██
░██   ░██   ░██  ░█████░██ ░██░█████████ ░█████████ ░██  ░███████`)

    console.log(`\n${color.dim('Quickly build HTML emails with Tailwind CSS.')}\n`)
    console.log(`Docs:       https://maizzle.com \nGitHub:     https://github.com/maizzle\n`)

  p.intro(`${color.bgBlack(color.white(' create-maizzle '))}`)

    project = await p.group(
      {
        path: () =>
          p.text({
            message: 'Where should we create your project?',
            placeholder: './maizzle',
            validate: value => {
              if (!value) return 'Please enter a path.'
              if (value[0] !== '.') return 'Please enter a relative path.'
              if (existsSync(value)) return 'That directory already exists. Please enter a different path.'
            },
          }),
        starter: async () => {
          const starter = await p.select({
            message: 'Select a Starter',
            initialValue: 'maizzle/maizzle',
            options: [
              { value: 'maizzle/maizzle', label: 'Default' },
              { value: 'custom', label: 'Custom' },
            ],
          })

          if (starter === 'custom') {
            const customStarter = await p.select({
              message: 'Select a custom Starter',
              initialValue: 'maizzle/maizzle',
              options: [
                ...starters,
                { value: 'git', label: 'Git', hint: 'user/repo' },
              ],
            })

            if (customStarter === 'git') {
              return p.text({
                message: 'Enter a `user/repo` path or a full Git repository URL.',
                validate: value => {
                  if (!value) return 'Please enter a value.'
                },
              })
            }

            return customStarter
          }

          return starter
        },
        install: () =>
          p.confirm({
            message: 'Install dependencies?',
            initialValue: true,
          }),
        pm: async ({ results }) => {
          if (!results.install) return 'npm'

          const detected = await detectPackageManager(process.cwd()).catch(() => null)

          return p.select({
            message: 'Select a package manager',
            initialValue: detected?.name || 'npm',
            options: [
              { value: 'npm', label: 'npm' },
              { value: 'pnpm', label: 'pnpm' },
              { value: 'yarn', label: 'yarn' },
              { value: 'bun', label: 'bun' },
            ],
          })
        },
      },
      {
        onCancel: () => {
          p.cancel('💀')
          process.exit(0)
        },
      }
    )
  }

  const spinner = p.spinner()

  /**
   * Clone the starter project.
   */
  spinner.start('Creating project')

  const starter = starters.find(s => s.value === project.starter)
  const source = starter ? starter.path : project.starter

  await downloadTemplate(source.includes(':') ? source : `gh:${source}`, {
    dir: project.path,
  })

  /**
   * Remove .github folder if it exists
   */
  await rm(`${project.path}/.github`, {
    recursive: true,
    force: true
  })

  spinner.stop(`Created project in ${project.path}`)

  /**
   * Install dependencies
   */
  if (project.install) {
    try {
      execFileSync(project.pm, ['--version'], { stdio: 'ignore' })
    } catch {
      p.log.error(`${project.pm} is not installed. Please install it first.`)
      process.exit(1)
    }

    spinner.start('Installing dependencies')
    const startTime = Date.now()

    await installDependencies({
      cwd: project.path,
      silent: true,
      packageManager: project.pm,
    })

    spinner.stop(`Installed dependencies ${color.gray((Date.now() - startTime) / 1000 + 's')}`)
  }

  const pm = project.pm || 'npm'
  const runCmd = pm === 'yarn' ? 'yarn dev' : `${pm} run dev`

  let nextSteps = `cd ${project.path}        \n\n${project.install ? '' : `${pm} install\n\n`}${runCmd}`

  p.note(nextSteps, 'Next steps:')

  p.outro(`Documentation: https://maizzle.com/docs \n\n   Components: https://mailviews.com`)

  process.exit(0)
}
