export type Jitsi = {
  id: string
  createdAt: string
  updatedAt: string
  active: boolean
  jid: string
  occupants: JitsiOccupant[]
  polls: object[]
  raw: object
  speakerStats: JitsiSpeakers[]
}

export type JitsiOccupant = {
  active: boolean
  id: string
  email: string
  nick: string
  sourceInfo: string
  statsId: string
  codecType: string
}

export type JitsiSpeakers = {
  id: string
  username: string
  isSilent: boolean
  isDominantSpeaker: boolean
  dominantSpeakerStart: number
  totalDominantSpeakerTime: number
}

export type JitsiUser = {
  id: number
  names: string[]
  giveGold?: boolean
}
