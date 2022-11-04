const cron = require("node-cron");
const controller = require("./controller.xAPILogger");
const lrs = require("./lrs/lrs");


cron.schedule("0 0 * * *", async () => {
  try {
    console.log('xAPI scheduler started');
    const statements = await controller.fetchUnsentStatements();
    if (statements.length > 0) {
      const sentStatementsIds = await lrs.sendStatementsToLrs(statements);
      controller.deleteSentStatements(sentStatementsIds);
    }
  } catch (err) {
    console.log(err);
  }
});
