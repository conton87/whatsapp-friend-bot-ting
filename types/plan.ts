export interface PlanPageData {
  id: string;
  title: string;
  group_label: string | null;
  host_name: string;
  cut_off_utc: string;
  options_slots: string[];
  options_venues: string[];
  currency: string | null;
  status: 'open' | 'confirmed';
}

export interface SummaryChip {
  name: string;
  note: string;
}
