import { CronJob } from "cron";

import { backup } from "./backup";
import { env } from "./env";

const jobDaily = new CronJob(env.BACKUP_CRON_SCHEDULE, async () => {
  try {
    await backup('daily');
  } catch (error) {
    console.error("Error while running backup: ", error)
  }
});

// const jobWeekly = new CronJob(env.BACKUP_CRON_SCHEDULE_WEEKLY, async () => {
//   try {
//     await backup('weekly');
//   } catch (error) {
//     console.error("Error while running backup: ", error)
//   }
// });

// const jobMonthly = new CronJob(env.BACKUP_CRON_SCHEDULE_MONTHLY, async () => {
//   try {
//     await backup('monthly');
//   } catch (error) {
//     console.error("Error while running backup: ", error)
//   }
// });

jobDaily.start();
// jobWeekly.start();
// jobMonthly.start();

console.log("Backup cron scheduled...")
