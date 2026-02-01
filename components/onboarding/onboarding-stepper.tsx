'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type BusinessType = 'Imobiliária' | 'Corretor autônomo' | 'Incorporadora' | 'Outro'
type UserRoleOption = 'Dono(a)' | 'Gestor(a)' | 'Corretor(a)'
type UserRole = 'admin' | 'manager' | 'member'

interface OnboardingData {
  businessName: string
  businessType: BusinessType | ''
  userRole: UserRoleOption | ''
  pipelineChoice: 'default' | 'later' | ''
}

export function OnboardingStepper() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [data, setData] = useState<OnboardingData>({
    businessName: '',
    businessType: '',
    userRole: '',
    pipelineChoice: '',
  })

  const totalSteps = 5

  const mapUserRole = (role: UserRoleOption): UserRole => {
    const mapping: Record<UserRoleOption, UserRole> = {
      'Dono(a)': 'admin',
      'Gestor(a)': 'manager',
      'Corretor(a)': 'member',
    }
    return mapping[role]
  }

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNext = () => {
    setError('')

    if (step === 2) {
      if (!data.businessName.trim()) {
        setError('Por favor, informe o nome da empresa')
        return
      }
      if (!data.businessType) {
        setError('Por favor, selecione o tipo de negócio')
        return
      }
    }

    if (step === 3 && !data.userRole) {
      setError('Por favor, selecione seu papel')
      return
    }

    if (step === 4 && !data.pipelineChoice) {
      setError('Por favor, escolha uma opção')
      return
    }

    setStep(step + 1)
  }

  const handleComplete = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Sessão expirada. Faça login novamente.')
        return
      }

      const tenantId = user.user_metadata?.tenant_id || user.app_metadata?.tenant_id

      if (!tenantId) {
        setError('Erro ao identificar sua conta. Contate o suporte.')
        return
      }

      const slug = generateSlug(data.businessName)
      const userRole = mapUserRole(data.userRole as UserRoleOption)

      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          businessName: data.businessName.trim(),
          businessType: data.businessType,
          slug,
          userRole,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao completar onboarding')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao completar configuração')
      setLoading(false)
    }
  }

  return (
    <Card className="border-border/40 shadow-lg">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Passo {step} de {totalSteps}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i + 1 <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <>
            <CardTitle className="text-2xl">
              Vamos configurar seu espaço em menos de 2 minutos
            </CardTitle>
            <CardDescription>
              Isso nos ajuda a preparar o IMOBI360 do jeito certo pra você.
            </CardDescription>
          </>
        )}

        {step === 2 && (
          <>
            <CardTitle className="text-2xl">Informações do negócio</CardTitle>
            <CardDescription>
              Como devemos chamar sua empresa?
            </CardDescription>
          </>
        )}

        {step === 3 && (
          <>
            <CardTitle className="text-2xl">Qual é o seu papel aqui?</CardTitle>
            <CardDescription>
              Isso nos ajuda a configurar as permissões certas.
            </CardDescription>
          </>
        )}

        {step === 4 && (
          <>
            <CardTitle className="text-2xl">Pipeline de vendas</CardTitle>
            <CardDescription>
              Como você costuma trabalhar seus leads?
            </CardDescription>
          </>
        )}

        {step === 5 && (
          <>
            <CardTitle className="text-2xl">Seu espaço está pronto</CardTitle>
            <CardDescription>
              Tudo configurado! Você já pode começar a usar o IMOBI360.
            </CardDescription>
          </>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 1 && (
          <Button onClick={handleNext} className="w-full h-11">
            Começar
          </Button>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nome da empresa</Label>
              <Input
                id="businessName"
                placeholder="Imobiliária Exemplo"
                value={data.businessName}
                onChange={(e) =>
                  setData({ ...data, businessName: e.target.value })
                }
                className="h-11"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Tipo de negócio</Label>
              <select
                id="businessType"
                value={data.businessType}
                onChange={(e) =>
                  setData({ ...data, businessType: e.target.value as BusinessType })
                }
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Selecione...</option>
                <option value="Imobiliária">Imobiliária</option>
                <option value="Corretor autônomo">Corretor autônomo</option>
                <option value="Incorporadora">Incorporadora</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button onClick={handleNext} className="w-full h-11">
              Continuar
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-3">
              {(['Dono(a)', 'Gestor(a)', 'Corretor(a)'] as const).map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-3 rounded-lg border border-input p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <input
                    type="radio"
                    name="userRole"
                    value={role}
                    checked={data.userRole === role}
                    onChange={(e) =>
                      setData({ ...data, userRole: e.target.value as UserRoleOption })
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">{role}</span>
                </label>
              ))}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="h-11"
              >
                Voltar
              </Button>
              <Button onClick={handleNext} className="flex-1 h-11">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-lg border border-input p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="radio"
                  name="pipeline"
                  value="default"
                  checked={data.pipelineChoice === 'default'}
                  onChange={() =>
                    setData({ ...data, pipelineChoice: 'default' })
                  }
                  className="h-4 w-4 mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium">
                    Pipeline padrão{' '}
                    <span className="text-xs text-muted-foreground">(recomendado)</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Novo Lead → Contato → Qualificado → Proposta → Negociação → Ganho/Perdido
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-input p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="radio"
                  name="pipeline"
                  value="later"
                  checked={data.pipelineChoice === 'later'}
                  onChange={() =>
                    setData({ ...data, pipelineChoice: 'later' })
                  }
                  className="h-4 w-4 mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium">Ajustar depois</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Você poderá personalizar o pipeline nas configurações
                  </div>
                </div>
              </label>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="h-11"
              >
                Voltar
              </Button>
              <Button onClick={handleNext} className="flex-1 h-11">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">
                Seu espaço <strong>{data.businessName}</strong> está configurado e pronto para uso.
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              onClick={handleComplete}
              disabled={loading}
              className="w-full h-11"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Preparando...
                </span>
              ) : (
                'Ir para o Dashboard'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
