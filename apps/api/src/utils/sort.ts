import type { SQL} from 'drizzle-orm';
import { asc, desc, getTableColumns, type Table } from 'drizzle-orm';

export function parseSortString<T extends Table>(table: T, sortString: string): SQL<unknown>[] {
  const expressions = sortString.split(';').map((s) => s.trim());
  if (!expressions.length) {
    return [];
  }

  const columns = getTableColumns(table);
  const sql: SQL<unknown>[] = [];

  for (const expression of expressions) {
    const parts = expression.split(':').map((s) => s.trim());
    if (parts.length !== 2) {
      throw new Error('Invalid sort string');
    }

    const [columnString, direction] = parts;
    if (!Object.keys(columns).includes(columnString)) {
      throw new Error(`Invalid column: ${columnString}`);
    }

    if (direction !== 'asc' && direction !== 'desc') {
      throw new Error(`Invalid direction: ${direction}`);
    }

    const column = columns[columnString];
    sql.push(direction === 'asc' ? asc(column) : desc(column));
  }

  return sql;
}
