'use client';

import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function PasswordInput({
  hideLabel,
  id,
  name,
  showLabel,
}: {
  hideLabel: string;
  id: string;
  name: string;
  showLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  const label = visible ? hideLabel : showLabel;

  return (
    <div className="relative">
      <Input autoComplete="current-password" className="pe-11" id={id} name={name} type={visible ? 'text' : 'password'} />
      <Button
        aria-label={label}
        aria-pressed={visible}
        className="absolute end-0 top-0 text-muted-foreground"
        onClick={() => setVisible((current) => !current)}
        size="icon"
        type="button"
        variant="ghost"
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
  );
}
