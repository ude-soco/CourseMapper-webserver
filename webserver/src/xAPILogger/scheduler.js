const cron = require("node-cron");
const controller = require("./controller.xAPILogger");
const lrs = require("./lrs/lrs");

export const runXapiScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      console.log("xAPI scheduler started");
      const statements = await controller.fetchUnsentStatements();
      if (statements.length > 0) {

        if ( statements.length > 100 ){

          const loops = Math.ceil(statements.length / 100);

          for(let i = 0; i < loops ; i++){
            const start = i * 100;
            const end = start + 100 <= statements.length ? start + 100 : statements.length;
            const sentStatementsIds = await lrs.sendStatementsToLrs(statements.slice(start, end));
            controller.updateSentStatements(sentStatementsIds);
          }

        } else {
          const sentStatementsIds = await lrs.sendStatementsToLrs(statements);
          controller.updateSentStatements(sentStatementsIds);
        }

      }
      
    } catch (err) {
      console.log(err);
    }
  });
};
