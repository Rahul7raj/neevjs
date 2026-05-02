import React from 'react'
import type { ModelRecord } from '@neevjs/shared'
import { useModel } from '../hooks/useModel'

export interface TableColumn<T extends ModelRecord> {
  key: keyof T & string
  label?: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

export interface TableClassNames {
  root?: string
  table?: string
  thead?: string
  tr?: string
  th?: string
  tbody?: string
  td?: string
  actions?: string
  editButton?: string
  deleteButton?: string
  emptyState?: string
  errorState?: string
  loadingState?: string
}

export interface TableStyles {
  root?: React.CSSProperties
  table?: React.CSSProperties
  thead?: React.CSSProperties
  tr?: React.CSSProperties
  th?: React.CSSProperties
  tbody?: React.CSSProperties
  td?: React.CSSProperties
  actions?: React.CSSProperties
  editButton?: React.CSSProperties
  deleteButton?: React.CSSProperties
  emptyState?: React.CSSProperties
  errorState?: React.CSSProperties
  loadingState?: React.CSSProperties
}

export interface TableProps<T extends ModelRecord> {
  model: string
  columns?: TableColumn<T>[]
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  emptyMessage?: string
  classNames?: TableClassNames
  styles?: TableStyles
  unstyled?: boolean
}

export function Table<T extends ModelRecord>({
  model,
  columns,
  onEdit,
  onDelete,
  emptyMessage = 'No records found.',
  classNames = {},
  styles = {},
  unstyled = false,
}: TableProps<T>): React.ReactElement {
  const { data, loading, error } = useModel<T>(model)

  if (loading) {
    return (
      <div className={classNames.loadingState ?? "neev-table-loading"} style={styles.loadingState}>
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={classNames.errorState ?? "neev-table-error"} style={styles.errorState}>
        <p>Error: {error.message}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={classNames.emptyState ?? "neev-table-empty"} style={styles.emptyState}>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  // Auto-detect columns from first row if not provided
  const resolvedColumns: TableColumn<T>[] =
    columns ??
    Object.keys(data[0]).map((key) => ({
      key: key as keyof T & string,
      label: key.charAt(0).toUpperCase() + key.slice(1),
    }))

  return (
    <div className={classNames.root ?? "neev-table-wrapper"} style={{ ...(!unstyled ? { overflowX: 'auto' } : {}), ...styles.root }}>
      <table className={classNames.table ?? "neev-table"} style={{ ...(!unstyled ? { width: '100%', borderCollapse: 'collapse' } : {}), ...styles.table }}>
        <thead className={classNames.thead} style={styles.thead}>
          <tr className={classNames.tr} style={styles.tr}>
            {resolvedColumns.map((col) => (
              <th
                key={col.key}
                className={classNames.th}
                style={{
                  ...(!unstyled ? {
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderBottom: '2px solid #e5e7eb',
                    fontWeight: 600,
                    color: '#374151',
                    background: '#f9fafb',
                  } : {}),
                  ...styles.th,
                }}
              >
                {col.label ?? col.key}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th
                className={classNames.th}
                style={{
                  ...(!unstyled ? {
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderBottom: '2px solid #e5e7eb',
                    fontWeight: 600,
                    color: '#374151',
                    background: '#f9fafb',
                  } : {}),
                  ...styles.th,
                }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className={classNames.tbody} style={styles.tbody}>
          {data.map((row, rowIndex) => (
            <tr
              key={String(row.id ?? rowIndex)}
              className={classNames.tr}
              style={{ ...(!unstyled ? { borderBottom: '1px solid #e5e7eb' } : {}), ...styles.tr }}
            >
              {resolvedColumns.map((col) => (
                <td
                  key={col.key}
                  className={classNames.td}
                  style={{ ...(!unstyled ? { padding: '10px 12px', color: '#1f2937', verticalAlign: 'middle' } : {}), ...styles.td }}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '')}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className={classNames.actions ?? classNames.td} style={{ ...(!unstyled ? { padding: '10px 12px', verticalAlign: 'middle' } : {}), ...styles.td, ...styles.actions }}>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      className={classNames.editButton}
                      style={{
                        ...(!unstyled ? {
                          marginRight: 8,
                          padding: '4px 10px',
                          fontSize: 13,
                          cursor: 'pointer',
                          background: '#3b82f6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                        } : {}),
                        ...styles.editButton,
                      }}
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(row)}
                      className={classNames.deleteButton}
                      style={{
                        ...(!unstyled ? {
                          padding: '4px 10px',
                          fontSize: 13,
                          cursor: 'pointer',
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                        } : {}),
                        ...styles.deleteButton,
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
