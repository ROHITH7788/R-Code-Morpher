"use client"
import { ButtonHTMLAttributes } from 'react'

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', disabled, children, ...rest } = props
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`px-3 py-1 rounded border border-transparent bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-700 hover:to-accent-600 text-white disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}
