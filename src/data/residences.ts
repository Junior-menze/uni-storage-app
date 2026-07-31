export interface Residence {
  id: string
  name: string
  campus: 'UMP' | 'TUT Nelspruit'
  address: string
  latitude?: number
  longitude?: number
}

export const RESIDENCES: Residence[] = [
  // UMP Residences
  {
    id: 'ump-res-1',
    name: 'UMP Main Residence',
    campus: 'UMP',
    address: 'University of Mpumalanga, Nelspruit'
  },
  {
    id: 'ump-res-2',
    name: 'UMP East Residence',
    campus: 'UMP',
    address: 'East Campus, University of Mpumalanga, Nelspruit'
  },
  {
    id: 'ump-res-3',
    name: 'UMP West Residence',
    campus: 'UMP',
    address: 'West Campus, University of Mpumalanga, Nelspruit'
  },
  // TUT Residences
  {
    id: 'tut-res-1',
    name: 'TUT Main Residence',
    campus: 'TUT Nelspruit',
    address: 'TUT Nelspruit Campus, Nelspruit'
  },
  {
    id: 'tut-res-2',
    name: 'TUT East Residence',
    campus: 'TUT Nelspruit',
    address: 'East Campus, TUT Nelspruit, Nelspruit'
  },
  {
    id: 'tut-res-3',
    name: 'TUT West Residence',
    campus: 'TUT Nelspruit',
    address: 'West Campus, TUT Nelspruit, Nelspruit'
  }
]

export function getResidencesByCampus(campus: string): Residence[] {
  return RESIDENCES.filter(r => r.campus === campus)
}

export function getResidenceById(id: string): Residence | undefined {
  return RESIDENCES.find(r => r.id === id)
}