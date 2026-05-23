export interface LocationResult {
  x: number
  y: number
  addressEN: string
  addressZH: string
  nameEN: string
  nameZH: string
  districtEN: string
  districtZH: string
  displayAddress: string
  [key: string]: unknown
}

export type LocationSlot = 'start' | 'end'
