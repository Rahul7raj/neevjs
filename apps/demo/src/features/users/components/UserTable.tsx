import React from 'react'
import { Table } from '@neevjs/client'
import { User } from '../../../models/user'

interface UserTableProps {
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

export function UserTable({ onEdit, onDelete }: UserTableProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <Table<User>
        model="users"
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          {
            key: 'role',
            label: 'Role',
            render: (val) => (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  background: val === 'admin' ? '#fef3c7' : '#dbeafe',
                  color: val === 'admin' ? '#92400e' : '#1e40af',
                }}
              >
                {String(val)}
              </span>
            ),
          },
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
        emptyMessage="No users yet. Add one above!"
      />
    </div>
  )
}
