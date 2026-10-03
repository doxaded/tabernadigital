import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';

async function check() {
  try {
    const info = await git.getRemoteInfo({
      http,
      url: 'https://github.com/doxaded/tabernadigital.git'
    });
    console.log('Remote info successfully retrieved:');
    console.log(JSON.stringify(info, null, 2));
  } catch (err) {
    console.error('Remote check error:', err.message);
  }
}

check();
