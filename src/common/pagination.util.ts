export interface PaginationQuery {
  page?: number | string;
  pageSize?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  q?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export function parsePagination(query?: PaginationQuery): {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  q?: string;
} {
  const page = Math.max(1, parseInt(String(query?.page || 1), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(query?.pageSize || 20), 10) || 20));
  const skip = (page - 1) * pageSize;
  const sortOrder = query?.sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';

  return {
    page,
    pageSize,
    skip,
    take: pageSize,
    sortBy: query?.sortBy,
    sortOrder,
    q: query?.q?.trim() || undefined,
  };
}

export function createPaginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

