import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../../src/components/ui/button';

test('plain action buttons without handlers render disabled', () => {
  const html = renderToStaticMarkup(<Button type="button">Placeholder</Button>);

  assert.match(html, /\sdisabled=""/);
  assert.match(html, /aria-disabled="true"/);
});

test('submit buttons and linked buttons stay active', () => {
  const submit = renderToStaticMarkup(<Button type="submit">Save</Button>);
  const link = renderToStaticMarkup(<Button asChild type="button"><a href="/dashboard">Open</a></Button>);

  assert.doesNotMatch(submit, /\sdisabled=/);
  assert.doesNotMatch(link, /\sdisabled=/);
});
