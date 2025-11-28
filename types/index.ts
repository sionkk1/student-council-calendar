export interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string; // ISO string
  end_time?: string; // ISO string
  is_all_day: boolean;
  category?: string;
  color_tag?: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingMinutes {
  id: string;
  event_id: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  uploaded_at: string;
}
