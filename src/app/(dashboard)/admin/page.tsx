import { getConsolidatedDashboard } from '@/modules/dashboard/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

const formatMoney = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export default async function AdminDashboardPage() {
  const consolidated = await getConsolidatedDashboard()

  const totalCondominiums = consolidated.length
  const totalOverdue = consolidated.reduce((acc, curr) => acc + curr.summary.overdueCount, 0)
  const totalBalance = consolidated.reduce((acc, curr) => acc + curr.balance, 0)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Control Tower</h1>
        <p className="text-muted-foreground mt-1">Visão consolidada de todas as empresas sob sua gestão</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCondominiums}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Global (Realizado)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-primary' : 'text-red-600'}`}>
              {formatMoney(totalBalance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas (Inadimplência Global)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalOverdue} <span className="text-sm font-normal text-muted-foreground">vencimentos acumulados</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Painel das Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Receitas</TableHead>
                <TableHead className="text-right">Despesas</TableHead>
                <TableHead className="text-right">Saldo Atual</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consolidated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                    Nenhuma empresa cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                consolidated.map((item) => (
                  <TableRow key={item.condominium.id}>
                    <TableCell className="font-medium">
                      <Link href={`/empresa/${item.condominium.id}`} className="hover:underline text-primary">
                        {item.condominium.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatMoney(item.summary.actualIncome)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatMoney(item.summary.actualExpense)}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${item.balance >= 0 ? 'text-primary' : 'text-red-600'}`}>
                      {formatMoney(item.balance)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.summary.overdueCount > 0 ? (
                        <div className="flex items-center justify-center text-red-600" title={`${item.summary.overdueCount} contas vencidas`}>
                          <AlertCircle className="h-5 w-5 mr-1" />
                          <span className="text-xs font-bold">{item.summary.overdueCount}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-green-600" title="Tudo em dia">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
