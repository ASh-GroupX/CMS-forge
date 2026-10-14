import React from 'react';
import { Input } from '../ui/input';
import { Field } from '../shared/ui-primitives';

export function TextField({ label, name, value = '' }: { label: string; name: string; value?: string | number | undefined }) {
  const id = `${name}-${String(value || 'new').replace(/\W+/g, '-')}`;
  return <Field id={id} label={label}><Input defaultValue={value} id={id} name={name} /></Field>;
}

export function NumberField({ label, name, value }: { label: string; name: string; value: number | '' }) {
  const id = `${name}-${String(value || 'blank')}`;
  return <Field id={id} label={label}><Input defaultValue={value} id={id} min={1} name={name} type="number" /></Field>;
}
