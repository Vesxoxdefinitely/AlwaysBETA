module.exports = {
  apps: [{
    name: 'ticket-system-backend',
    script: 'src/index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3001,
      MONGODB_URI: 'mongodb://localhost:27017/ticket-system',
      JWT_SECRET: 'ticket-system-secret-key-2024-very-secure-and-long',
      YANDEX_USER: 'AlwaysaHelper@yandex.ru',
      YANDEX_PASS: 'ydgeyrmgwhzniqip'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      MONGODB_URI: 'mongodb://localhost:27017/ticket-system',
      JWT_SECRET: 'ticket-system-secret-key-2024-very-secure-and-long',
      YANDEX_USER: 'AlwaysaHelper@yandex.ru',
      YANDEX_PASS: 'ydgeyrmgwhzniqip'
    }
  }]
}; 