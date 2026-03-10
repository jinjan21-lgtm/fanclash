'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Widget } from '@/types';

export function useWidget(widgetId: string) {
  const [widget, setWidget] = useState<Widget | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('widgets').select('*').eq('id', widgetId).single()
      .then(({ data }) => setWidget(data));
  }, [widgetId]);

  return widget;
}
