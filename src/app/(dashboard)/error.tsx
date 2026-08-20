'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-red-500/10 p-3">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Não foi possível concluir a ação</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-[40ch]">
          Algo deu errado ao salvar. Verifique os dados informados e tente novamente.
        </p>
        {error.message && (
          <p className="text-xs text-muted-foreground/70 mt-2 font-mono max-w-[50ch] break-words">
            {error.message}
          </p>
        )}
      </div>
      <Button onClick={() => reset()}>Tentar novamente</Button>
    </div>
  )
}
