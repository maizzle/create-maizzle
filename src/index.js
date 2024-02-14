import degit from 'degit';
import color from 'picocolors';
import * as p from '@clack/prompts';
import { setTimeout } from 'node:timers/promises';

export async function main() {
  console.clear();

  p.intro(`${color.bgCyan(color.black(' create-maizzle '))}`);

  const project = await p.group(
    {
      path: () =>
        p.text({
          message: 'Where should we create your project?',
          placeholder: './maizzle',
          validate: value => {
            if (!value) return 'Please enter a path.';
            if (value[0] !== '.') return 'Please enter a relative path.';
          },
        }),
      starter: async () => {
        const starter = await p.select({
          message: 'Select a Starter',
          initialValue: 'default',
          options: [
            { value: 'default', label: 'Default' },
            { value: 'custom', label: 'Custom' },
          ],
        });

        if (starter === 'custom') {
          const starters = await p.select({
            message: 'Select a custom Starter',
            initialValue: 'default',
            options: [
              { value: 'api', label: 'API' },
              { value: 'amp', label: 'AMP4Email' },
              { value: 'mc', label: 'Mailchimp' },
              { value: 'md', label: 'Markdown' },
              { value: 'wp', label: 'WordPress API' },
              { value: 'git', label: 'Git', hint: 'provide a git url' },
            ],
          });

          if (starters === 'git') {
            const url = await p.text({
              message: 'Enter a Git repository url',
              validate: value => {
                if (!value) return 'Please enter a Git repository url.';
                if (!value.endsWith('.git')) return 'Please include the .git extension.';
              },
            });
            return console.log(url);
          }

          return starters;
        }
      },
      install: () =>
        p.confirm({
          message: 'Install dependencies?',
          initialValue: true,
        }),
    },
    {
      onCancel: () => {
        p.cancel('💀');
        process.exit(0);
      },
    }
  );

  if (project.install) {
    const s = p.spinner();
    s.start('Installing dependencies');

    await setTimeout(2500);
    s.stop('Installed dependencies');
  }

  let nextSteps = `cd ${project.path}        \n${project.install ? '' : 'npm install\n'}npm run dev`;

  p.note(nextSteps, 'Next steps.');

  p.outro(`Join the community: ${color.underline(color.cyan('https://maizzle.com/discord'))}

   Documentation: ${color.underline(color.cyan('https://maizzle.com/docs'))}

   Problems? ${color.underline(color.cyan('https://maizzle.com/issues'))}`
  );

}
