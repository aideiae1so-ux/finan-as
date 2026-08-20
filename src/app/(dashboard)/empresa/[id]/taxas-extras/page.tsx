import { getExtraFees, createExtraFee } from '@/modules/extra-fees/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formatMoney = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export default async function ExtraFeesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: condominiumId } = await params
  const fees = await getExtraFees(condominiumId)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Taxas Extras</h1>
          <p className="text-muted-foreground mt-1">Gestão de arrecadações especiais da empresa</p>
        </div>
        
        <Dialog>
          <DialogTrigger render={<Button />}>
            Nova Taxa Extra
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Planejar Arrecadação Extra</DialogTitle>
            </DialogHeader>
            <form action={createExtraFee} className="space-y-4 pt-4">
              <input type="hidden" name="condominium_id" value={condominiumId} />
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição / Motivo</Label>
                <Input id="description" name="description" required placeholder="Ex: Pintura da Fachada" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_amount">Meta (Valor Total)</Label>
                  <Input id="total_amount" name="total_amount" type="number" step="0.01" required placeholder="0,00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="installments_count">Parcelas (Duração)</Label>
                  <Input id="installments_count" name="installments_count" type="number" min="1" required defaultValue="1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input id="start_date" name="start_date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodicity">Periodicidade</Label>
                  <Select name="periodicity" defaultValue="MONTHLY">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Mensal</SelectItem>
                      <SelectItem value="WEEKLY">Semanal</SelectItem>
                      <SelectItem value="YEARLY">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit">Iniciar Arrecadação</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {fees.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-muted-foreground border rounded-lg bg-muted/50">
            Nenhuma taxa extra cadastrada para esta empresa.
          </div>
        ) : (
          fees.map(fee => {
            const progress = (fee.collected_amount / fee.total_amount) * 100
            
            return (
              <Card key={fee.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{fee.description}</CardTitle>
                      <CardDescription>
                        {fee.installments_count} parcelas de {formatMoney(fee.installment_amount)}
                      </CardDescription>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      fee.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                      fee.status === 'FINISHED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {fee.status === 'ACTIVE' ? 'Arrecadando' : fee.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Progresso</span>
                      <span className="font-bold">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground pt-1">
                      <span>Arrecadado: {formatMoney(fee.collected_amount)}</span>
                      <span>Meta: {formatMoney(fee.total_amount)}</span>
                    </div>
                  </div>
                  <div className="pt-2 text-xs text-muted-foreground flex justify-between border-t">
                    <span>Início: {new Date(fee.start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC'})}</span>
                    <span>Previsão Fim: {new Date(fee.end_date).toLocaleDateString('pt-BR', { timeZone: 'UTC'})}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
