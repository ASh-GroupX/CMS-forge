"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EMPTY_VALUE = "__cms_auto_empty_select_value__"

export type FormSelectOption = {
  disabled?: boolean
  label: string
  value: string
}

type FormSelectProps = {
  "aria-describedby"?: string | undefined
  "aria-invalid"?: boolean | undefined
  className?: string | undefined
  defaultValue?: string | undefined
  disabled?: boolean | undefined
  id?: string | undefined
  name?: string | undefined
  onValueChange?: ((value: string) => void) | undefined
  options: FormSelectOption[]
  placeholder?: string | undefined
  required?: boolean | undefined
  value?: string | undefined
}

export function FormSelect({
  className,
  defaultValue = "",
  disabled,
  id,
  name,
  onValueChange,
  options,
  placeholder,
  required,
  value,
  ...ariaProps
}: FormSelectProps) {
  const controlled = value !== undefined
  const initialValue = defaultValue || (placeholder ? "" : options[0]?.value ?? "")
  const [internalValue, setInternalValue] = React.useState(initialValue)
  const selectedValue = controlled ? value : internalValue
  const selectedLabel = options.find((option) => option.value === selectedValue)?.label

  function changeValue(nextValue: string) {
    const normalizedValue = nextValue === EMPTY_VALUE ? "" : nextValue
    if (!controlled) setInternalValue(normalizedValue)
    onValueChange?.(normalizedValue)
  }

  return (
    <>
      <Select
      {...(disabled === undefined ? {} : { disabled })}
      {...(name === undefined ? {} : { name })}
      onValueChange={changeValue}
      {...(required === undefined ? {} : { required })}
      value={selectedValue}
      >
        <SelectTrigger
        {...(ariaProps["aria-describedby"] === undefined ? {} : { "aria-describedby": ariaProps["aria-describedby"] })}
        {...(ariaProps["aria-invalid"] === undefined ? {} : { "aria-invalid": ariaProps["aria-invalid"] })}
        className={cn("min-w-0", className)}
        {...(id === undefined ? {} : { id })}
        >
          <SelectValue placeholder={placeholder}>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {placeholder ? <SelectItem value={EMPTY_VALUE}>{placeholder}</SelectItem> : null}
          {options.map((option) => (
            <SelectItem {...(option.disabled === undefined ? {} : { disabled: option.disabled })} key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span aria-hidden="true" className="hidden" data-slot="select-options">
        {options.map((option) => <span data-value={option.value} key={option.value}>{option.label} </span>)}
      </span>
    </>
  )
}
