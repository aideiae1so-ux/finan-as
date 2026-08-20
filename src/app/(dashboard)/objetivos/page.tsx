import { getGoals, createGoal, type Goal } from '@/modules/goals/actions'
import { getInvestmentSummary, getSpendingByCategory, type InvestmentSummary, type CategorySpending } from '@/modules/dashboard/actions'
import { getOrCreatePersonalContext } from '@/modules/contexts/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { GoalCard } from '@/components/goals/GoalCard'
import Link from 'next/link'

export default async function GoalsPage({ searchParams }: { searchParams: Promise<{ context_id?: string }> }) {
  const params = await searchParams

  // Sem contexto selecionado na URL (ex: vindo do menu lateral fora de uma empresa),
  // caímos no contexto pessoal do usuário, criando-o sob demanda se ainda não existir.
  const currentContextId = params.context_id || (await getOrCreatePersonalContext()) || undefined

  let goals: Goal[] = []
  let investment: InvestmentSummary | null = null
  let spendingBreakdown: CategorySpending[] = []

  if (currentContextId) {
    const [g, inv, sp] = await Promise.all([
      getGoals(currentContextId),
      getInvestmentSummary(currentContextId),
      getSpendingByCategory(currentContextId),
    ])
    goals = g
    investment = inv
    spendingBreakdown = sp.breakdown
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Objetivos</h1>
          <p className="text-muted-foreground mt-1">Defina uma meta e acompanhe se está no caminho pra chegar lá</p>
        </div>

        {currentContextId && investment?.categoryExists && (
          <Dialog>
            <DialogTrigger render={<Button />}>
              Novo Objetivo
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Objetivo</DialogTitle>
              </DialogHeader>
              <form action={createGoal} className="space-y-4 pt-4">
                <input type="hidden" name="context_id" value={currentContextId} />

                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Objetivo</Label>
                  <Input id="name" name="name" required placeholder="Ex: Comprar um carro" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_amount">Valor Alvo</Label>
                    <Input id="target_amount" name="target_amount" type="number" step="0.01" min="0.01" required placeholder="50000,00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_saved_amount">Já Guardado (opcional)</Label>
                    <Input id="current_saved_amount" name="current_saved_amount" type="number" step="0.01" min="0" placeholder="0,00" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_date">Data Alvo (opcional)</Label>
                  <Input id="target_date" name="target_date" type="date" min={today} />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!currentContextId ? (
        <Card>
          <CardContent className="text-center py-6 text-muted-foreground">
            Selecione um contexto (Empresa ou Pessoal) para visualizar os objetivos.
          </CardContent>
        </Card>
      ) : !investment?.categoryExists ? (
        <Card>
          <CardContent className="text-center py-10 space-y-3">
            <p className="text-sm text-muted-foreground max-w-[42ch] mx-auto">
              Os objetivos usam sua categoria de despesa &quot;Investimentos&quot; pra calcular o ritmo mensal — crie ela primeiro em Categorias.
            </p>
            <Link href={`/configuracoes/categorias?context_id=${currentContextId}`} className="text-sm font-medium text-primary hover:underline">
              Ir para Categorias
            </Link>
          </CardContent>
        </Card>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10 text-muted-foreground">
            Nenhum objetivo cadastrado ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              investment={investment!}
              spendingBreakdown={spendingBreakdown}
              hasMultipleGoals={goals.length > 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
