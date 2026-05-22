export type PaginationState = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PaginationMeta = {
  pagination?: PaginationState;
};
