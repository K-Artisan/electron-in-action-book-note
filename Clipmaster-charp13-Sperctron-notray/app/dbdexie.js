const Dexie = require('dexie');
const db = new Dexie('clipsmarter_database');

db.version(1).stores({
    clips: '++id, value, data'
});

module.exports = db;