import { login, signup } from './actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Building2 } from 'lucide-react'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 gap-6">
      <div className="flex items-center gap-2">
        <div className="bg-primary p-2 rounded-lg">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-xl tracking-tight text-foreground">Suporte Controle Financeiro</span>
      </div>
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Login</CardTitle>
          <CardDescription>
            Entre no sistema de gestão financeira
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="auth-form" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            
            {params.error && (
              <div className="text-sm font-medium text-red-500">
                {params.error}
              </div>
            )}
            {params.message && (
              <div className="text-sm font-medium text-green-600">
                {params.message}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button formAction={login} type="submit" className={cn(buttonVariants({ variant: 'default' }), "w-full")}>
                Entrar
              </button>
              <button formAction={signup} type="submit" className={cn(buttonVariants({ variant: 'outline' }), "w-full")}>
                Registrar
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
