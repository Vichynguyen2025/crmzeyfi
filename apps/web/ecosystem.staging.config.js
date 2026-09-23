module.exports = {
  apps: [
    {
      name: "crmzeyfi-staging",
      cwd: "/opt/crmzeyfi-staging/apps/api",
      script: "src/index.ts",
      interpreter: "/opt/crmzeyfi-staging/apps/api/node_modules/.bin/tsx",
      env: {
        PORT: 4001,
        JWT_SECRET: "zeyfi-secret",
        DB_USER: "root",
        DB_NAME: "crmzeyfi"
      }
    }
  ]
};