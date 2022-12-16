const cron = require("node-cron");
const controller = require("./controller.xAPILogger");
const lrs = require("./lrs/lrs");

export const runXapiScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      console.log("xAPI scheduler started");
      const statements = await controller.fetchUnsentStatements();
      if (statements.length > 0) {
        const sentStatementsIds = await lrs.sendStatementsToLrs(statements);
        controller.updateSentStatements(sentStatementsIds);
      }
    } catch (err) {
      console.log(err);
    }
  });
};
