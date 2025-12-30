// Shared types for the songs feature

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Attachment {
  id: string
  file_name: string
  file_path: string
  file_size: number
  created_at: string
}

export interface Song {
  id: string
  title: string
  artist: string | null
  default_key: string | null
  duration_seconds: number | null
  created_at: string
  tags: Tag[]
  song_attachments?: Attachment[]
}
