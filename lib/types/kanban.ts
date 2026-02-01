export interface KanbanDeal {
  id: string
  title: string
  value: number | null
  status: string
  contact_id: string | null
  assigned_to: string | null
  expected_close_date: string | null
  created_at: string | null
  contact: {
    id: string
    name: string
    email: string | null
    phone: string | null
    type: string
  } | null
}

export interface KanbanStage {
  id: string
  name: string
  color: string | null
  position: number
  is_won: boolean | null
  is_lost: boolean | null
  deals: KanbanDeal[]
}

export interface KanbanResponse {
  data: KanbanStage[]
}
