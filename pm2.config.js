module.exports = {
    apps: [{
      name        : 'BotForever',
      script      : 'index.js',
      log         : 'pm2.log',
      output      : 'NULL',
      error       : 'NULL',
      merge_logs  : true
    }]
  };
  