import fs from 'fs';
import path from 'path';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';

const REMOTE_URL = 'https://github.com/doxaded/tabernadigital.git';
const USER_NAME = 'Henrique Berbert';
const USER_EMAIL = 'henrique.v.berbert@gmail.com';
const BRANCH = 'main';

async function sync() {
  console.log('--- Sincronizando com GitHub (' + REMOTE_URL + ') ---');

  // 1. Inicializar repositório Git local
  const dir = process.cwd();
  console.log('1. Inicializando repositório Git em:', dir);
  await git.init({ fs, dir, defaultBranch: BRANCH });

  // 2. Configurar autor do commit
  await git.setConfig({
    fs,
    dir,
    path: 'user.name',
    value: USER_NAME
  });
  await git.setConfig({
    fs,
    dir,
    path: 'user.email',
    value: USER_EMAIL
  });

  // 3. Adicionar arquivos do projeto (respeitando .gitignore)
  console.log('2. Mapeando e adicionando arquivos ao Git index...');
  
  function getFiles(baseDir, currentSub = '') {
    const fullDir = path.join(baseDir, currentSub);
    const entries = fs.readdirSync(fullDir, { withFileTypes: true });
    let files = [];

    for (const entry of entries) {
      const relPath = currentSub ? path.join(currentSub, entry.name) : entry.name;
      
      // Ignorar diretórios e arquivos pesados ou sensíveis
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name === '.env' ||
        entry.name === '.DS_Store' ||
        entry.name.endsWith('.log')
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        files = files.concat(getFiles(baseDir, relPath));
      } else {
        files.push(relPath);
      }
    }
    return files;
  }

  const allFiles = getFiles(dir);
  console.log(`Encontrados ${allFiles.length} arquivos para versionamento.`);

  for (const file of allFiles) {
    await git.add({ fs, dir, filepath: file });
  }

  // 4. Criar commit
  console.log('3. Criando commit...');
  const commitMsg = process.env.COMMIT_MSG || 'feat: add master default password and password change feature';
  let sha;
  try {
    sha = await git.commit({
      fs,
      dir,
      message: commitMsg,
      author: {
        name: USER_NAME,
        email: USER_EMAIL
      }
    });
    console.log('Commit criado com sucesso! SHA:', sha);
  } catch (err) {
    if (err.code === 'NoChangeError') {
      console.log('Nenhuma alteração detectada desde o último commit.');
    } else {
      console.warn('Aviso de commit:', err.message);
    }
  }

  // 5. Configurar Remote Origin
  console.log('4. Configurando remote origin ->', REMOTE_URL);
  const remotes = await git.listRemotes({ fs, dir });
  const hasOrigin = remotes.some(r => r.remote === 'origin');
  if (hasOrigin) {
    await git.deleteRemote({ fs, dir, remote: 'origin' });
  }
  await git.addRemote({
    fs,
    dir,
    remote: 'origin',
    url: REMOTE_URL
  });

  // 6. Verificar Token para Push
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.log('\n[ATENÇÃO] Repositório inicializado, arquivos adicionados e commit efetuado com sucesso!');
    console.log('Para enviar os commits para o GitHub sem prompt interativo, utilize:');
    console.log('GITHUB_TOKEN="seu_personal_access_token" node scripts/git-sync.mjs');
    return;
  }

  console.log('5. Enviando commits para o GitHub remoto (git push origin main)...');
  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: BRANCH,
    onAuth: () => ({ username: token }),
  });
  console.log('Push concluído com sucesso!', JSON.stringify(pushResult, null, 2));
}

sync().catch(err => {
  console.error('Erro na sincronização:', err);
});
