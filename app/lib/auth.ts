import { Response, NextFunction } from "express"
import { Session } from "@app/models/session.model"
import { User } from "@app/models/user.model"
import { Plan } from "@app/models/plan.model"
import { Theme } from "@app/models/theme.model"
import { Domain } from "@app/models/domain.model"
import { Op } from "sequelize"
import maxmind, { AsnResponse, CityResponse, Reader } from "maxmind"

let asn: Reader<AsnResponse>
let city: Reader<CityResponse>
maxmind
  .open<AsnResponse>(process.cwd() + "/app/lib/GeoLite2-ASN.mmdb")
  .then((reader) => {
    asn = reader
  })

maxmind
  .open<CityResponse>(process.cwd() + "/app/lib/GeoLite2-City.mmdb")
  .then((reader) => {
    city = reader
  })

function checkScope(requiredScope: string, scope: string) {
  if (scope === "*") {
    return true
  }
  // scope is the current session scope, and requiredScope is the scope required for the route, formatted like user.read or user.write
  // check if the required scope is contained in the current scope, comma separated
  const scopes = scope.split(",")
  for (const scope of scopes) {
    if (scope === requiredScope) {
      return true
    }
    if (scope?.split(".")[0] === requiredScope) {
      return true
    }
  }
  return false
}

async function updateSession(session: Session, ip: string) {
  if (session.updatedAt.getTime() + 5 * 60 * 1000 > new Date().getTime()) return
  if (session.type === "session") {
    session
      .update({
        expiredAt: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000)
      })
      .then(() => {})
  }
  let accessedFrom = session.info?.accessedFrom || []
  if (!accessedFrom.find((aF: AccessedFrom) => aF.ip === ip)) {
    const asnResponse = await asn?.get(ip)
    const cityResponse = await city?.get(ip)
    accessedFrom.push({
      isp: asnResponse?.autonomous_system_organization,
      location: cityResponse?.city?.names?.en,
      ip: ip,
      date: new Date().toISOString(),
      asn: asnResponse?.autonomous_system_number
    })
  }

  await Session.update(
    {
      info: {
        ...session.info,
        accessedFrom: accessedFrom
      }
    },
    {
      where: {
        id: session.id
      }
    }
  )
}

const auth = (scope: string, passthrough: boolean = false) => {
  return async function (req: any, res: Response, next: NextFunction) {
    try {
      const token = req.header("Authorization")
      if (!scope) scope = "*"
      if (token) {
        const session = await Session.findOne({
          where: {
            token: token,
            expiredAt: {
              [Op.or]: [
                {
                  [Op.gt]: new Date()
                },
                {
                  [Op.is]: null
                }
              ]
            }
          },
          include: [
            {
              model: User,
              as: "user",
              required: true,
              include: [
                {
                  model: Domain,
                  as: "domain"
                },
                {
                  model: Plan,
                  as: "plan"
                },
                {
                  model: Theme,
                  as: "theme"
                }
              ]
            }
          ]
        })
        if (session) {
          if (!checkScope(scope, session.scopes)) {
            if (passthrough) {
              req.user = null
              return next()
            }
            res.status(401)
            res.json({
              errors: [
                {
                  name: "SCOPE_REQUIRED",
                  message:
                    "You do not have permission to access this resource due to your current API key scopes.",
                  currentScopes: session.scopes,
                  requiredScope: scope,
                  status: 401
                }
              ]
            })
            updateSession(session, req.ip).then(() => {})
            return
          }
          if (session.user?.banned) {
            if (passthrough) {
              req.user = null
              return next()
            }
            res.sendStatus(401)
            updateSession(session, req.ip).then(() => {})
            return
          } else {
            req.user = session.user
            next()
            updateSession(session, req.ip).then(() => {})
            return
          }
        } else {
          if (passthrough) {
            req.user = null
            return next()
          }
          res.status(401)
          res.json({
            errors: [
              {
                name: "noJWT",
                message:
                  "You must provide a token in the Authorization header.",
                status: 401
              }
            ]
          })
        }
      } else {
        if (passthrough) {
          req.user = null
          return next()
        }
        res.status(401)
        res.json({
          errors: [
            {
              name: "noJWT",
              message: "You must provide a token in the Authorization header.",
              status: 401
            }
          ]
        })
      }
    } catch (err) {
      console.log(err)
      if (passthrough) {
        req.user = null
        return next()
      }
      res.status(401)
      res.json({
        errors: [
          {
            name: "invalidJWT",
            message: "Your authorization token is invalid or has expired.",
            status: 401
          }
        ]
      })
    }
  }
}

export default auth
