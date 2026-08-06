export type HabitType = 'daily' | 'weekly'

export interface Habit {
  id: string
  user_id: string
  name: string
  type: HabitType
  goal: number
  color: string
  sort_order: number
  archived: boolean
  created_at: string
}

export interface Completion {
  id: string
  user_id: string
  habit_id: string
  date: string // YYYY-MM-DD
  created_at: string
}
