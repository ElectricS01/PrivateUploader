import { gql } from "@apollo/client";

export const GetUserQuery = gql`
  query GetUserQuery {
    currentUser {
      username
      email
      description
      administrator
      darkTheme
      emailVerified
      banned
      inviteId
      discordPrecache
      avatar
      domainId
      totpEnable
      quota
      moderator
      subscriptionId
      itemsPerPage
      banner
      alternatePasswords {
        scopes
        totp
        name
      }
      status
      storedStatus
      weatherUnit
      themeEngine {
        theme {
          dark {
            colors {
              primary
              logo1
              logo2
              secondary
              accent
              error
              info
              success
              warning
              card
              toolbar
              sheet
              text
              dark
              gold
              background
              background2
            }
            dark
          }
          light {
            dark
          }
          amoled {
            dark
            colors {
              primary
              logo1
              logo2
              secondary
              accent
              error
              info
              success
              warning
              card
              toolbar
              sheet
              text
              dark
              gold
              background
              background2
            }
          }
        }
        fluidGradient
        gradientOffset
        version
        deviceSync
        showOnProfile
        baseTheme
        customCSS
      }
      xp
      publicProfile
      privacyPolicyAccepted
      plan {
        quotaMax
        color
        internalName
        name
        icon
        id
      }
      domain {
        active
        domain
        id
      }
      badges {
        color
        icon
        id
        image
        name
        priority
        tooltip
      }
      excludedCollections
      id
      language
      nameColor
      subscription {
        metadata {
          hours
        }
        cancelled
      }
      insights
      notifications {
        id
        dismissed
        message
        route
      }
      integrations {
        type
        providerUsername
        providerUserId
        providerUserCache
        createdAt
        id
        error
        expiresAt
      }
    }
  }
`;
