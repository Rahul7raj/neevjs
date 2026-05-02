import React, { useState } from 'react'
import type { ModelRecord } from '@neevjs/shared'
import { useModel } from '../hooks/useModel'

export interface FormField {
  name: string
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select'
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
}

export interface FormClassNames {
  root?: string
  error?: string
  label?: string
  input?: string
  select?: string
  textarea?: string
  submitButton?: string
}

export interface FormStyles {
  root?: React.CSSProperties
  error?: React.CSSProperties
  label?: React.CSSProperties
  input?: React.CSSProperties
  select?: React.CSSProperties
  textarea?: React.CSSProperties
  submitButton?: React.CSSProperties
}

export interface FormProps<T extends ModelRecord> {
  model: string
  fields?: FormField[]
  initialValues?: Partial<T>
  editId?: number | string
  onSuccess?: () => void
  onError?: (err: Error) => void
  submitLabel?: string
  classNames?: FormClassNames
  styles?: FormStyles
  unstyled?: boolean
  transformPayload?: (payload: Partial<T>) => Partial<T> | Promise<Partial<T>>
  onSubmitOverride?: (payload: Partial<T>) => Promise<void>
  children?: React.ReactNode
}

export function Form<T extends ModelRecord>({
  model,
  fields,
  initialValues = {},
  editId,
  onSuccess,
  onError,
  submitLabel = 'Submit',
  classNames = {},
  styles = {},
  unstyled = false,
  transformPayload,
  onSubmitOverride,
  children,
}: FormProps<T>): React.ReactElement {
  const { create, update } = useModel<T>(model)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    const formData = new FormData(e.currentTarget)
    const payload = Object.fromEntries(formData.entries()) as Omit<T, 'id'>

    try {
      let finalPayload = payload as Partial<T>
      if (transformPayload) {
        finalPayload = await transformPayload(finalPayload)
      }

      if (onSubmitOverride) {
        await onSubmitOverride(finalPayload)
      } else {
        if (editId !== undefined) {
          await update(editId, finalPayload)
        } else {
          await create(finalPayload as Omit<T, 'id'>)
        }
      }
      onSuccess?.()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setFormError(error.message)
      onError?.(error)
    } finally {
      setSubmitting(false)
    }
  }

  const baseInputStyle: React.CSSProperties = unstyled ? {} : {
    display: 'block',
    width: '100%',
    padding: '8px 10px',
    fontSize: 14,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    outline: 'none',
    boxSizing: 'border-box',
    marginTop: 4,
  }

  const baseLabelStyle: React.CSSProperties = unstyled ? {} : {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 12,
  }

  return (
    <form className={classNames.root} onSubmit={(e) => void handleSubmit(e)} style={{ width: '100%', ...styles.root }}>
      {formError && (
        <div
          className={classNames.error}
          style={{
            ...(!unstyled ? {
              padding: '8px 12px',
              marginBottom: 12,
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: 6,
              fontSize: 13,
            } : {}),
            ...styles.error,
          }}
        >
          {formError}
        </div>
      )}

      {/* Auto-generated fields if provided */}
      {fields?.map((field) => (
        <label key={field.name} className={classNames.label} style={{ ...baseLabelStyle, ...styles.label }}>
          {field.label ?? field.name}
          {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}

          {field.type === 'textarea' ? (
            <textarea
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              defaultValue={String(initialValues[field.name] ?? '')}
              className={classNames.textarea ?? classNames.input}
              style={{ ...baseInputStyle, minHeight: 80, resize: 'vertical', ...styles.input, ...styles.textarea }}
            />
          ) : field.type === 'select' ? (
            <select
              name={field.name}
              required={field.required}
              defaultValue={String(initialValues[field.name] ?? '')}
              className={classNames.select ?? classNames.input}
              style={{ ...baseInputStyle, ...styles.input, ...styles.select }}
            >
              <option value="">Select...</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type ?? 'text'}
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              defaultValue={String(initialValues[field.name] ?? '')}
              className={classNames.input}
              style={{ ...baseInputStyle, ...styles.input }}
            />
          )}
        </label>
      ))}

      {/* Custom children fields */}
      {children}

      <button
        type="submit"
        disabled={submitting}
        className={classNames.submitButton}
        style={{
          ...(!unstyled ? {
            marginTop: 8,
            padding: '9px 20px',
            background: submitting ? '#9ca3af' : '#111827',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            width: '100%',
          } : {}),
          ...styles.submitButton,
        }}
      >
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
