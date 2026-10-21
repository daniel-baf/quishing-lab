const { PORT, LAN_IP } = require('./config/environment');
const { createApplication } = require('./app');

const app = createApplication();

app.listen(PORT, '0.0.0.0', () => {
  console.log('============================================');
  console.log('  QUISHING LAB — educational demo (ephemeral)');
  console.log('  Landing:   http://localhost:' + PORT + '/');
  console.log('  Dashboard: http://localhost:' + PORT + '/admin');
  console.log('  LAN:       http://' + (LAN_IP || 'LAN-IP') + ':4000 (Juice Shop — QR arsenal bait)');
  console.log('  Token:     defined in .env');
  console.log('  Tunnel:    cloudflared tunnel --url http://localhost:' + PORT);
  console.log('============================================');
});
