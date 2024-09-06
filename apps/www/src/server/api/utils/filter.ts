import type {
  Table} from 'drizzle-orm';
import {
  and,
  arrayContained,
  eq,
  getTableColumns,
  gt,
  gte,
  ilike,
  inArray,
  ne,
  not,
  or,
  type SQL,
} from 'drizzle-orm';

export const operators = [
  '=',
  '!=',
  '~=',
  '>',
  '>=',
  '<',
  '<=',
  'in',
  'IN',
  'contains',
  'CONTAINS',
] as const;
export type Operator = (typeof operators)[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cleanseValue(value: string): any {
  // String values can be wrapped in single or double quotes
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  // Boolean values
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }

  // Numbers
  if (!isNaN(Number(value))) {
    return Number(value);
  }

  // Any other value is parsed as JSON
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function parseFilterExpression<T extends Table>(table: T, expression: string): SQL<unknown> {
  const columns = getTableColumns(table);
  const tokens = expression.split(' ');

  if (tokens.length < 2) {
    throw new Error('Invalid filter expression');
  }

  const isNot = tokens[0].match(/^not$/i);

  const field = tokens[isNot ? 1 : 0];
  const column = columns[field];
  if (!column) {
    throw new Error(`Invalid field: ${field}`);
  }

  const operator = tokens[isNot ? 2 : 1] as Operator;
  if (!operators.includes(operator)) {
    throw new Error(`Invalid operator: ${operator}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const value = cleanseValue(tokens.slice(isNot ? 3 : 2).join(' '));

  let sql: SQL<unknown>;
  switch (operator) {
    case '=': {
      sql = eq(column, value);
      break;
    }
    case '!=': {
      sql = ne(column, value);
      break;
    }
    case '~=': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      sql = ilike(column, value);
      break;
    }
    case '>': {
      sql = gt(column, value);
      break;
    }
    case '>=': {
      sql = gte(column, value);
      break;
    }
    case '<': {
      sql = gt(column, value);
      break;
    }
    case '<=': {
      sql = gte(column, value);
      break;
    }
    case 'in':
    case 'IN': {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      sql = inArray(column, value);
      break;
    }
    case 'contains':
    case 'CONTAINS': {
      sql = arrayContained(column, value);
      break;
    }
    default: {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Invalid operator: ${operator}`);
    }
  }

  return isNot ? not(sql) : sql;
}

/**
 * Parse filter strings into SQL.
 *
 * A filter string can be like:
 * id ~= "123" and (name = "Ian" and (test = 123 or test = 345))
 *
 * @param table
 * @param filter
 * @returns
 */
export function parseFilterString<T extends Table>(table: T, filter: string): SQL<unknown> {
  const expressions = filter.split(/\s+and\s+|\s+or\s+/i);
  const operators = filter.match(/\s+and\s+|\s+or\s+/gi)?.map((op) => op.trim()) ?? [];

  if (expressions.length === 1) {
    return parseFilterExpression(table, filter);
  }

  let sql: SQL<unknown> | undefined;

  let operator = operators.shift();
  for (let i = 0; i < expressions.length; i++) {
    const expression = expressions[i];

    if (expression.startsWith('(')) {
      expressions[i] = expression.slice(1);
      let endParenIdx: number | undefined = undefined;
      for (let j = expressions.length - 1; j > i; j--) {
        if (expressions[j].endsWith(')')) {
          expressions[j] = expressions[j].slice(0, -1);
          endParenIdx = j;
          break;
        }
      }
      if (!endParenIdx) {
        throw new Error('Invalid filter string');
      }

      let subExpression = '';
      let subOperator;
      if (sql) {
        subOperator = operators.shift();
      } else {
        subOperator = operator;
        operator = operators.shift();
      }
      for (let k = i; k <= endParenIdx; k++) {
        subExpression += expressions[k];
        if (k < endParenIdx) {
          subExpression += ` ${subOperator} `;
          if (sql) {
            subOperator = operators.shift();
          } else {
            subOperator = operator;
            operator = operators.shift();
          }
        }
      }

      if (sql) {
        sql =
          operator === 'and'
            ? and(sql, parseFilterString(table, subExpression))
            : or(sql, parseFilterString(table, subExpression));
        operator = operators.shift();
      } else {
        sql = parseFilterString(table, subExpression);
      }
      i = endParenIdx;
    } else {
      if (sql) {
        sql =
          operator === 'and'
            ? and(sql, parseFilterExpression(table, expression))
            : or(sql, parseFilterExpression(table, expression));
        operator = operators.shift();
      } else {
        sql = parseFilterExpression(table, expression);
      }
    }
  }

  if (!sql) {
    throw new Error('Invalid filter string');
  }

  return sql;
}
