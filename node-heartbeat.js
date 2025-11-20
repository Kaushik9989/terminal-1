const os = require('os');
const axios = require('axios');

const ADMIN_SERVER = process.env.SERVER_URL || 'http://localhost:8080'; // ← set this
const LOCKER_ID = process.env.LOCKER_ID || 'L02020';                     // ← set this
const TOKEN = process.env.TERMINAL_TOKEN || 'my-token-if-needed';       // optional
const INTERVAL_MS = Number(process.env.HEARTBEAT_INTERVAL_MS || 30_000);

function getSystemInfo() {
  return {
    os: `${os.type()} ${os.release()}`,
    uptimeSec: Math.floor(os.uptime()),
    freeMemMb: Math.floor(os.freemem() / (1024 * 1024)),
    totalMemMb: Math.floor(os.totalmem() / (1024 * 1024)),
    firmwareVersion: 'v1.0.0'
  };
}

async function sendHeartbeat() {
  const meta = getSystemInfo();
  const payload = { lockerId: LOCKER_ID, meta };
  console.log('=> Sending heartbeat payload:', JSON.stringify(payload));

  try {
    const res = await axios.post(
      `${ADMIN_SERVER}/api/terminal/heartbeat`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(TOKEN ? { 'x-terminal-token': TOKEN } : {})
        },
        timeout: 10000
      }
    );
    console.log(new Date().toISOString(), '[HEARTBEAT OK]', res.status, res.data);
  } catch (err) {
    // network / no response errors usually land here
    console.error('[HEARTBEAT ERR] message:', err.message);
    if (err.code) console.error('[HEARTBEAT ERR] code:', err.code);
    if (err.response) {
      console.error('[HEARTBEAT ERR] status:', err.response.status);
      console.error('[HEARTBEAT ERR] body:', err.response.data);
    } else {
      console.error('[HEARTBEAT ERR] no response received from server');
    }
    console.error('[HEARTBEAT ERR] config url:', err.config && err.config.url);
    console.error('[HEARTBEAT ERR] stack:', err.stack);
  }
}


sendHeartbeat();
setInterval(sendHeartbeat, INTERVAL_MS);
