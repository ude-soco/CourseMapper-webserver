const cron = require("node-cron");
const controller = require("./controller.xAPILogger");
const lrs = require("./lrs/lrs");
const BATCH_SIZE = 500;

export const runXapiScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const statements = await controller.fetchUnsentStatements();
      if (statements.length > 0) {

        if ( statements.length > BATCH_SIZE ){

          const loops = Math.ceil(statements.length / BATCH_SIZE);

          for(let i = 0; i < loops ; i++){
            const start = i * BATCH_SIZE;
            const end = start + BATCH_SIZE <= statements.length ? start + BATCH_SIZE : statements.length;
            const sentStatementsIds = await lrs.sendStatementsToLrs(statements.slice(start, end));
            await controller.updateSentStatements(sentStatementsIds);
          }

        } else {
          const sentStatementsIds = await lrs.sendStatementsToLrs(statements);
          await controller.updateSentStatements(sentStatementsIds);
        }

      }

    } catch (err) {
      console.log(err);
    }
  });
};
