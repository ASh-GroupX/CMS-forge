import React from 'react';
import { Skeleton } from '../../../components/ui/skeleton';
export default function Loading() { return <div aria-busy="true" className="grid gap-5"><Skeleton className="h-10 w-64" /><Skeleton className="h-12 w-full" />{[1, 2, 3].map((key) => <Skeleton className="h-32 w-full" key={key} />)}</div>; }
