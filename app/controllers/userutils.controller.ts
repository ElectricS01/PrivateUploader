import { UserUtilsService } from "@app/services/userutils.service"
import { Request, Response } from "express"
import { Service } from "typedi"
import { StatusCodes } from "http-status-codes"
import auth from "@app/lib/auth"
import { RequestAuth } from "@app/types/express"
import Errors from "@app/lib/errors"
import Router from "express-promise-router"

//const HTTP_STATUS_CREATED = 201;

@Service()
export class UserUtilsController {
  router: any

  constructor(private readonly userUtilsService: UserUtilsService) {
    this.configureRouter()
  }

  private configureRouter(): void {
    this.router = Router()

    /**
     * @swagger
     *
     * /api/v2/user:
     *   get:
     *     description: Return logged in user information.
     *     tags:
     *       - UserUtilsService
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: OK
     *     parameters:
     *         - in: header
     *           name: Authorization
     *           schema:
     *             type: string
     *             format: TPU-KEY
     *           required: true
     */
    this.router.get(
      "/",
      auth("user.view"),
      async (req: RequestAuth, res: Response) => {
        res.json(req.user)
      }
    )

    /**
     * @swagger
     *
     * /api/v2/user/all:
     *   get:
     *     description: All registered users.
     *     tags:
     *       - UserUtilsService
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: OK
     *     parameters:
     *         - in: header
     *           name: Authorization
     *           schema:
     *             type: string
     *             format: TPU-KEY
     *           required: true
     */
    this.router.get(
      "/all",
      auth("user.view"),
      async (req: Request, res: Response) => {
        res.json(await this.userUtilsService.getAllUsers())
      }
    )

    /**
     * @swagger
     *
     * /api/v2/user/profile/{username}:
     *   get:
     *     description: Get information about a user.
     *     tags:
     *       - UserUtilsService
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: OK
     *     parameters:
     *         - in: header
     *           name: Authorization
     *           schema:
     *             type: string
     *             format: TPU-KEY
     *           required: true
     *         - in: path
     *           name: username
     *           schema:
     *             type: string
     *           required: true
     */
    this.router.get(
      "/profile/:username",
      auth("user.view"),
      async (req: Request, res: Response) => {
        const user = await this.userUtilsService.getUser(req.params.username)
        if (user) {
          res.json(user)
        } else {
          throw Errors.USER_NOT_FOUND
        }
      }
    )

    this.router.get("/inviteV2/:key", async (req: Request, res: Response) => {
      // Send the request to the service and send the response
      try {
        const invite = this.userUtilsService.getInvite(req.params.key)
        res.json(invite)
      } catch {
        res.sendStatus(StatusCodes.UNAUTHORIZED)
      }
    })
  }
}