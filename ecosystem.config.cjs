// PM2 config for project-run-complete (Vite production preview — serves ./dist).
// First time: pm2 start ecosystem.config.cjs
// Deploy: ./deploy.sh
// Ensure .env exists with VITE_* Supabase vars.
// Change LISTEN_PORT if nginx proxies to a different port (default 4173 = vite preview).

const LISTEN_PORT = "4173";

module.exports = {
  apps: [
    {
      name: "prime-clinic",
      script: "npm",
      args: `run preview -- --host 0.0.0.0 --port ${LISTEN_PORT}`,
      cwd: __dirname,
      env: { NODE_ENV: "production", PORT: LISTEN_PORT },
      env_file: ".env",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      watch: false,
    },
  ],
};
