import React from 'react';
import { WorkQueue } from '../../work-queue';

export default function Loading() {
  return <WorkQueue locale="en" state="loading" />;
}
