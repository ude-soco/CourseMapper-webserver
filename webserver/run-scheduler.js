// One-shot runner to fetch unsent activities, send to LRS, and update DB.
// Usage: node run-scheduler.js
require('dotenv').config();
const db = require('./src/models');
const controller = require('./src/activity-logger/controller/activity-controller');
const lrs = require('./src/activity-logger/lrs/lrs');

(async () => {
  try {
    // Ensure mongoose connects as server.js would
    await db.mongoose.connect(process.env.MONGO_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('run-scheduler: connected to MongoDB');

    const statements = await controller.getActivities();
    console.log('run-scheduler: fetched statements count =', statements.length);
    if (statements && statements.length > 0) {
      const sentIds = await lrs.sendStatementsToLrs(statements);
      if (sentIds && sentIds.length > 0) {
        await controller.updateActivities(sentIds);
        console.log('run-scheduler: updated sent statements count =', sentIds.length);
      } else {
        console.log('run-scheduler: no IDs returned from LRS; nothing to update');
      }
    }

    await db.mongoose.disconnect();
    console.log('run-scheduler: finished');
    process.exit(0);
  } catch (err) {
    console.error('run-scheduler: error', err);
    try { await db.mongoose.disconnect(); } catch(e){}
    process.exit(1);
  }
})();
