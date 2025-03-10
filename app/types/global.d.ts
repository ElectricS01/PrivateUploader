import "jest-extended"
import { Server, Socket } from "socket.io"
import djs from "dayjs"
import { Sequelize } from "sequelize-typescript"
import { Cache } from "@envelop/response-cache"
import { PubSubEngine } from "type-graphql"

// @ts-ignore
export interface SocketWithUser extends Socket {
  to(room: string | number | string[] | number[]): SocketWithUser
  join(rooms: string | string[] | number | number[]): SocketWithUser
}

export interface SocketServerWithUser extends Server {
  to(room: string | number | string[] | number[]): SocketServerWithUser
  join(rooms: string | string[] | number | number[]): SocketServerWithUser
  of(namespace: string): Server.Namespace
  in(room: string | string[] | number | number[])
}

declare global {
  /** @deprecated
   * Use redisClient import instead. This will be removed in the future.
   */
  var redis: any
  var db: Sequelize,
    config: TpuConfig,
    dayjs: typeof djs,
    socket: SocketServerWithUser,
    whitelist: { ip: string; name: string; groups: string[] }[],
    appRoot: string,
    rawAppRoot: string,
    queue: typeof import("@app/lib/queue").default,
    domain: string | undefined,
    authMock: any,
    mainWorker: boolean,
    storageRoot: string,
    gqlCache: Cache,
    pubsub: PubSubEngine
}

export {}
