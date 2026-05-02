import React from 'react'

export function NavBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        background: active ? '#3b82f6' : 'transparent',
        color: active ? '#fff' : '#9ca3af',
      }}
    >
      {children}
    </button>
  )
}
