export interface Biller {
  id: string;
  name: string;
  operator_id: number;
  logoUrl?: string;
}

export interface StateBillerSection {
  title: string;
  data: Biller[];
}
