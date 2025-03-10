import { createClient } from "redis"

const config = process.env.CONFIG
  ? JSON.parse(process.env.CONFIG || "{}")
  : require(global.appRoot + "/config/tpu.json")

const redisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port
  },
  //@ts-ignore
  username: config.redis.username || undefined,
  //@ts-ignore
  password: config.redis.password || undefined,
  database: config.redis.db
})

redisClient.on("error", (err): void => {
  if (err.hostname !== "defaulthostname") console.warn("[REDIS] Error: " + err)
})

redisClient.connect().then(() => console.log("Redis Client Connected"))

export default redisClient
