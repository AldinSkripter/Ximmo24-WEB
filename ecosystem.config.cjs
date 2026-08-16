require("dotenv").config();

const appName = `${process.env.NEXT_PUBLIC_APPLICATION_NAME || "eBroker"}-Website`;
const port = Number(process.env.PORT || 8001);

module.exports = {
  apps: [
    {
      name: appName,
      script: ".next/standalone/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: port,
        HOSTNAME: "0.0.0.0",
      },
      out_file: `./logs/${appName}-out.log`,
      error_file: `./logs/${appName}-error.log`,
      log_file: `./logs/${appName}-combined.log`,
      time: true,
    },
  ],
};
