export interface IAPIResponse<T> {
  message: string;
  data: T | null;
}
