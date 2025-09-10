export interface PaginationCursor {
  id?: string;
  startDate?: string;
  offset?: string;
}

export interface PaginationResult<T> {
  data: T[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor?: string;
  previousCursor?: string;
}

export function encodeCursor(cursor: PaginationCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

export function decodeCursor(cursor: string): PaginationCursor | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded) as PaginationCursor;
  } catch {
    return null;
  }
}

export function createPaginationResult<T>(
  data: T[],
  limit: number,
  cursor?: string,
  hasNextPage = false
): PaginationResult<T> {
  const hasPreviousPage = !!cursor;

  let nextCursor: string | undefined;
  let previousCursor: string | undefined;

  if (hasNextPage && data.length > 0) {
    const lastItem = data[data.length - 1] as { id?: string; startDate?: Date };
    if (lastItem.id && lastItem.startDate) {
      nextCursor = encodeCursor({
        id: lastItem.id,
        startDate: lastItem.startDate.toISOString(),
      });
    }
  }

  if (hasPreviousPage && data.length > 0) {
    const firstItem = data[0] as { id?: string; startDate?: Date };
    if (firstItem.id && firstItem.startDate) {
      previousCursor = encodeCursor({
        id: firstItem.id,
        startDate: firstItem.startDate.toISOString(),
      });
    }
  }

  return {
    data,
    hasNextPage,
    hasPreviousPage,
    nextCursor,
    previousCursor,
  };
}
