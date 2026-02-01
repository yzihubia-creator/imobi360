import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, FileText, DollarSign } from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    {
      title: 'Leads Ativos',
      value: '0',
      description: 'Nenhum lead cadastrado ainda',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Imóveis',
      value: '0',
      description: 'Nenhum imóvel cadastrado',
      icon: Building2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Contratos',
      value: '0',
      description: 'Nenhum contrato ativo',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Receita',
      value: 'R$ 0,00',
      description: 'Nenhuma receita registrada',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bem-vindo ao IMOBI360</h1>
        <p className="text-gray-600">
          Gerencie seus leads, imóveis, contratos e financeiro em um só lugar
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-600">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Começar a usar</CardTitle>
          <CardDescription>
            Configure o sistema e comece a gerenciar seus processos imobiliários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
              1
            </div>
            <div>
              <h3 className="font-semibold">Cadastre seus imóveis</h3>
              <p className="text-sm text-gray-600">
                Adicione os imóveis disponíveis no seu portfólio
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 font-semibold">
              2
            </div>
            <div>
              <h3 className="font-semibold">Adicione leads</h3>
              <p className="text-sm text-gray-600">
                Importe ou cadastre manualmente seus leads interessados
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-semibold">
              3
            </div>
            <div>
              <h3 className="font-semibold">Gerencie o funil</h3>
              <p className="text-sm text-gray-600">
                Use o Kanban para acompanhar o progresso de cada lead
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
