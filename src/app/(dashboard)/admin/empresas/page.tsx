import { getCondominiums, createCondominium } from '@/modules/condominiums/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from 'next/link'

export default async function CondominiumsPage() {
  const condominiums = await getCondominiums()

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>

        <Dialog>
          <DialogTrigger render={<Button />}>
            Nova Empresa
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
            </DialogHeader>
            <form action={createCondominium} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa</Label>
                <Input id="name" name="name" required placeholder="Ex: Residencial Flores" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ (Opcional)</Label>
                <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="active" name="active" defaultChecked />
                <Label htmlFor="active">Ativo</Label>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {condominiums.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                    Nenhuma empresa cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                condominiums.map((condo) => (
                  <TableRow key={condo.id}>
                    <TableCell className="font-medium">
                      <Link href={`/empresa/${condo.id}`} className="hover:underline text-primary">
                        {condo.name}
                      </Link>
                    </TableCell>
                    <TableCell>{condo.cnpj || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${condo.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {condo.active ? 'Ativo' : 'Inativo'}
                      </span>
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
