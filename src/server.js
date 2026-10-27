const { PORT, LAN_IP } = require('./config/environment');
const { createApplication } = require('./app');
const lootStore = require('./loot/models/lootStore');

const app = createApplication();

lootStore.init().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    const store = process.env.DATABASE_URL ? 'postgres' : 'in-memory';
    console.log('============================================');
    console.log('  QUISHING LAB — QR arsenal panel (loot: ' + store + ')');
    console.log('  Dashboard: http://localhost:' + PORT + '/admin');
    console.log('  LAN:       http://' + (LAN_IP || 'LAN-IP') + ':4000 (Juice Shop — QR arsenal bait)');
    console.log('  Token:     defined in .env');
    console.log('  Tunnels:   make tunnel (panel + store) — make tunnel-url prints the URLs');
    console.log('============================================');
  });
});
