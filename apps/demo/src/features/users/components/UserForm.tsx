import React from 'react'
import { Form } from '@neevjs/client'
import { User } from '../../../models/user'

interface UserFormProps {
  editUser: User | null
  onSuccess: () => void
}

export function UserForm({ editUser, onSuccess }: UserFormProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 20,
        marginBottom: 20,
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
        {editUser ? 'Edit User' : 'Add New User'}
      </h2>
      <Form<User>
        model="users"
        editId={editUser?.id}
        initialValues={editUser ?? {}}
        transformPayload={(payload) => {
          return {
            ...payload,
            name: payload.name?.toUpperCase(),
          }
        }}
        fields={[
          { name: 'name', label: 'Full Name', placeholder: 'e.g. Rahul Kushwaha', required: true },
          { name: 'email', label: 'Email', type: 'email', placeholder: 'e.g. rahul@example.com', required: true },
          {
            name: 'role',
            label: 'Role',
            type: 'select',
            required: true,
            options: [
              { label: 'Admin', value: 'admin' },
              { label: 'User', value: 'user' },
              { label: 'Manager', value: 'manager' },
            ],
          },
        ]}
        onSuccess={onSuccess}
        submitLabel={editUser ? 'Update User' : 'Create User'}
      />
    </div>
  )
}
