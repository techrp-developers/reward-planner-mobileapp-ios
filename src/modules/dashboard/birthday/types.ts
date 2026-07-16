export interface BirthdayEmployee {
  id: string | number;
  name: string;
  designation: string;
  department: string;
  photo?: string | null;
  message?: string | null;
}

export interface BirthdayAPIResponse {
  success: boolean;
  data: BirthdayEmployee[];
}
