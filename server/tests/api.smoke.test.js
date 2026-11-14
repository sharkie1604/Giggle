import http from 'node:http';

async function runSmokeTest() {
  console.log('Running API server smoke test...');
  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 5000,
    path: '/health',
    method: 'GET',
    timeout: 3000,
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`Smoke test response [${res.statusCode}]: ${data}`);
      if (res.statusCode === 200) {
        console.log('Smoke test passed successfully.');
        process.exit(0);
      } else {
        console.error('Smoke test failed: unexpected status code.');
        process.exit(1);
      }
    });
  });

  req.on('error', (err) => {
    console.error('Smoke test request error:', err.message);
    process.exit(1);
  });

  req.end();
}

if (process.argv[1].endsWith('api.smoke.test.js')) {
  runSmokeTest();
}
