const sqlite3 = require('sqlite3')
const { knex } = request('knex');

const database = knex({
  client: 'sqlite3',
  connection: {
    filename: './db/db.sqlite'
  },
  useNullAsDefault: true
});

//创建数据库表clipitems
database.schema.hasTable('clipitems').then(exist => {
  if (!exist) {
    return database.schema.createTable('clipitems', t => {
      t.increments('id').primary();//创建增主键
      t.string('value');
    })
  }
});

exports.database = database;