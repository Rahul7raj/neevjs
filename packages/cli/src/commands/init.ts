import prompts from 'prompts';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';

export async function init(projectName?: string) {
  const response = await prompts([
    {
      type: projectName ? null : 'text',
      name: 'name',
      message: 'Project name:',
      initial: 'my-neev-app'
    },
    {
      type: 'select',
      name: 'mode',
      message: 'Select project mode:',
      choices: [
        { title: 'Fullstack (Client + Server)', value: 'fullstack', description: 'React + Node.js/Express' },
        { title: 'API Mode (Client Only)', value: 'api', description: 'Connect to your existing backend' },
        { title: 'Hybrid Mode (Client Only)', value: 'hybrid', description: 'Connect models to multiple backends' }
      ],
      initial: 0
    }
  ]);

  const name = projectName || response.name;
  const mode = response.mode;

  if (!name || !mode) {
    console.log(chalk.red('Initialization cancelled.'));
    return;
  }

  const projectDir = path.resolve(process.cwd(), name);
  console.log(`\n🚀 Creating a new NeevJS project in ${chalk.cyan(projectDir)}...`);

  await fs.ensureDir(projectDir);

  // 1. Scaffold Client
  console.log(`📦 Scaffolding ${chalk.green('Client')}...`);
  await scaffoldClient(projectDir, name, mode);

  // 2. Scaffold Server if Fullstack
  if (mode === 'fullstack') {
    console.log(`📦 Scaffolding ${chalk.green('Server')}...`);
    await scaffoldServer(projectDir);
  }

  console.log(`\n✨ Project ${chalk.bold(name)} initialized successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${name}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
}

async function scaffoldClient(dir: string, name: string, mode: string) {
  const clientDir = mode === 'fullstack' ? path.join(dir, 'client') : dir;
  await fs.ensureDir(clientDir);

  // Basic package.json
  const pkg = {
    name: `${name}-client`,
    version: '0.1.0-beta',
    type: 'module',
    scripts: {
      "dev": "vite",
      "build": "vite build"
    },
    dependencies: {
      "@neevjs/client": "^0.1.0-beta",
      "react": "^19.0.0",
      "react-dom": "^19.0.0"
    },
    devDependencies: {
      "vite": "^5.0.0",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      "typescript": "^5.3.3"
    }
  };
  await fs.writeJson(path.join(clientDir, 'package.json'), pkg, { spaces: 2 });

  // neev.ts configuration
  let baseURL = mode === 'fullstack' ? '/api' : '';
  if (mode === 'api') {
    const { url } = await prompts({
      type: 'text',
      name: 'url',
      message: 'Enter your API baseURL:',
      initial: 'https://api.example.com/api'
    });
    baseURL = url;
  }

  const neevTs = `import { createClient, AuthPlugin, LoggerPlugin } from '@neevjs/client'

export const client = createClient({
  baseURL: '${baseURL}',
})

client.use(AuthPlugin)
client.use(LoggerPlugin)
`;

  await fs.ensureDir(path.join(clientDir, 'src/core'));
  await fs.writeFile(path.join(clientDir, 'src/core/neev.ts'), neevTs);

  // Example Component
  const exampleCode = mode === 'hybrid' ? 
`import { useModel } from '@neevjs/client'

export function HybridDemo() {
  // Primary backend (uses global baseURL)
  const { data: users } = useModel('users')

  // External backend (overrides baseURL)
  const { data: payments } = useModel('payments', {
    baseURL: 'https://api.external-service.com/api'
  })

  return (
    <div>
      <h1>Hybrid Mode Demo</h1>
      <p>Users from primary: {users.length}</p>
      <p>Payments from external: {payments.length}</p>
    </div>
  )
}` :
`import { useModel } from '@neevjs/client'

export function Dashboard() {
  const { data, loading } = useModel('users')

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h1>NeevJS Dashboard</h1>
      <ul>
        {data.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
    </div>
  )
}`;

  await fs.ensureDir(path.join(clientDir, 'src/features'));
  await fs.writeFile(path.join(clientDir, 'src/features/Demo.tsx'), exampleCode);
}

async function scaffoldServer(dir: string) {
  const serverDir = path.join(dir, 'server');
  await fs.ensureDir(serverDir);

  const pkg = {
    name: "neev-server",
    version: "0.1.0-beta",
    type: "module",
    scripts: {
      "dev": "nodemon src/server.ts"
    },
    dependencies: {
      "@neevjs/server": "^0.1.0-beta",
      "express": "^4.18.2",
      "cors": "^2.8.5"
    },
    devDependencies: {
      "nodemon": "^3.0.0",
      "ts-node": "^10.9.1",
      "typescript": "^5.3.3"
    }
  };
  await fs.writeJson(path.join(serverDir, 'package.json'), pkg, { spaces: 2 });
  
  const serverTs = `import { createServer } from '@neevjs/server'

const app = createServer()
const port = 3001

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`)
})
`;

  await fs.ensureDir(path.join(serverDir, 'src'));
  await fs.writeFile(path.join(serverDir, 'src/server.ts'), serverTs);
}
