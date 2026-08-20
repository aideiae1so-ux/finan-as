import { getCategories, createCategory } from '@/modules/categories/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getOrCreatePersonalContext } from '@/modules/contexts/actions'

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ context_id?: string }> }) {
  const params = await searchParams

  // Sem contexto selecionado na URL (ex: vindo do menu lateral fora de uma empresa),
  // caímos no contexto pessoal do usuário, criando-o sob demanda se ainda não existir.
  const currentContextId = params.context_id || (await getOrCreatePersonalContext()) || undefined

  const categories = currentContextId ? await getCategories(currentContextId) : []

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground mt-1">Gerencie as categorias de receitas e despesas</p>
        </div>
        
        {currentContextId && (
          <Dialog>
            <DialogTrigger render={<Button />}>
              Nova Categoria
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Categoria</DialogTitle>
              </DialogHeader>
              <form action={createCategory} className="space-y-4 pt-4">
                <input type="hidden" name="context_id" value={currentContextId} />
                
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Categoria</Label>
                  <Input id="name" name="name" required placeholder="Ex: Manutenção, Alimentação..." />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select name="type" required defaultValue="EXPENSE">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCOME">Receita</SelectItem>
                      <SelectItem value="EXPENSE">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorias do Contexto Atual</CardTitle>
        </CardHeader>
        <CardContent>
          {!currentContextId ? (
            <div className="text-center py-6 text-muted-foreground">
              Selecione um contexto (Empresa ou Pessoal) para visualizar e adicionar categorias.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                      Nenhuma categoria cadastrada neste contexto
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${category.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {category.type === 'INCOME' ? 'Receita' : 'Despesa'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
