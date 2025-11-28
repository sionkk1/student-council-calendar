export interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string; // ISO string
  end_time?: string; // ISO string
  is_all_day: boolean;
  category?: string;
  department?: string; // 부서
  color_tag?: string;
  is_school_event?: boolean; // 학교 일정 (수정 불가)
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
