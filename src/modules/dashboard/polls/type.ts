export type PollOption = {
  option_id: number;
  option_text: string;
  display_order: number;
  vote_count: number;
  selected: boolean;
};

export type LivePoll = {
  poll_id: number;
  question: string;
  allow_multiple: boolean;
  closes_at?: string | null;
  created_at: string;
  participant_count: number;
  has_voted: boolean;
  selected_option_ids: number[];
  options: PollOption[];
};