import { CronJob } from "cron";
import { backup } from "./backup";
import { env } from "./env";
const { Logtail } = require("@logtail/node");
const logtail = new Logtail("AsdCAwENWdJtukBJqK18RVrm>");

const job = new CronJob(env.BACKUP_CRON_SCHEDULE, async () => {
  try {
    await backup();
  } catch (error) {
    console.error("Error while running daily backup: ", error)
    logtail.error("Error while running daily backup");
  }
});

job.start();

console.log("Backup cron scheduled...")
logtail.info("Backup cron scheduled...");