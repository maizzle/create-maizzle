import degit from 'degit'
import color from 'picocolors'
import * as p from '@clack/prompts'
import { rm } from 'node:fs/promises'
import { installDependencies } from 'nypm'

const starters = [
  {
    label: 'v4.x',
    value: 'maizzle/starter-v4',
  },
  {
    label: 'API',
    value: 'maizzle/starter-api',
  },
  {
    label: 'AMP4Email',
    value: 'maizzle/starter-amp4email',
  },
  {
    label: 'Liquid',
    value: 'maizzle/starter-liquid',
  },
  {
    label: 'Mailchimp',
    value: 'maizzle/starter-mailchimp',
  },
  {
    label: 'Markdown',
    value: 'maizzle/starter-markdown',
  },
  {
    label: 'RSS',
    value: 'maizzle/starter-rss',
  },
  {
    label: 'WordPress API',
    value: 'maizzle/starter-wordpress-api',
  },
]

export async function main() {
  console.clear()

  p.intro(`${color.bgCyan(color.black(' create-maizzle '))}`)

  const project = await p.group(
    {
      path: () =>
        p.text({
          message: 'Where should we create your project?',
          placeholder: './maizzle',
          validate: value => {
            if (!value) return 'Please enter a path.'
            if (value[0] !== '.') return 'Please enter a relative path.'
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
    },
    {
      onCancel: () => {
        p.cancel('💀')
        process.exit(0)
      },
    }
  )

  const spinner = p.spinner()

  /**
   * Clone the starter project.
   */
  spinner.start('Creating project')

  const starter = starters.find(s => s.value === project.starter)

  const emitter = degit(starter ? starter.value : project.starter)

  await emitter.clone(project.path)

  /**
   * Remove .github folder if it exists
   */
  await rm(`${project.path}/.github`, {
    recursive: true,
    force: true
  })

  spinner.stop(`Created project ${color.gray('in ' + project.path)}`)

  /**
   * Install dependencies
   */
  if (project.install) {
    spinner.start('Installing dependencies')
    const startTime = Date.now()

    await installDependencies({
      cwd: project.path,
      silent: true,
      packageManager: 'npm',
    })

    spinner.stop(`Installed dependencies ${color.gray((Date.now() - startTime) / 1000 + 's')}`)
  }

  let nextSteps = `cd ${project.path}        \n${project.install ? '' : 'npm install\n'}npm run dev`

  p.note(nextSteps, 'Next steps:')

  p.outro(`Join the community: ${color.underline(color.cyan('https://maizzle.com/discord'))}

   Documentation: ${color.underline(color.cyan('https://maizzle.com/docs'))}

   Problems? ${color.underline(color.cyan('https://maizzle.com/issues'))}`
  )

  process.exit(0)
}
