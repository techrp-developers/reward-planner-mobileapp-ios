export interface Biller {
  id: string;
  name: string;
  operator_id: number;
  logoUrl?: string;
  logoAlt?: string;
}

export interface StateBillerSection {
  title: string;
  data: Biller[];
}
