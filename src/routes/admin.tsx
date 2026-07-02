import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Scissors,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Power,
  ChevronLeft,
  Loader2,
  Sliders,
  DollarSign as PriceIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

interface Booking {
  id: string;
  client_name: string;
  client_phone: string;
  booking_date: string;
  booking_time: string;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
  service_id: string;
  services?: {
    name: string;
    price: number;
  };
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string;
  active: boolean;
}

const STATIC_SERVICES_FALLBACK = [
  { id: "1", name: "Corte Clássico", price: 55, duration_minutes: 30, description: "Máquina, tesoura e finalização com navalha.", active: true },
  { id: "2", name: "Barba Desenhada", price: 45, duration_minutes: 30, description: "Toalha quente, óleo essencial e acabamento perfeito.", active: true },
  { id: "3", name: "Combo Fabricio", price: 90, duration_minutes: 60, description: "Corte + barba com ritual completo de cuidados.", active: true },
  { id: "4", name: "Pigmentação", price: 70, duration_minutes: 45, description: "Preenchimento e disfarce natural.", active: true },
  { id: "5", name: "Sobrancelha", price: 20, duration_minutes: 15, description: "Design masculino sob medida.", active: true },
  { id: "6", name: "Platinado", price: 180, duration_minutes: 120, description: "Descoloração premium com hidratação.", active: true },
];

function Admin() {
  const [activeTab, setActiveTab] = useState<"bookings" | "services">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isSupabaseOffline, setIsSupabaseOffline] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");

  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          client_name,
          client_phone,
          booking_date,
          booking_time,
          status,
          created_at,
          service_id,
          services (
            name,
            price
          )
        `)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });

      if (error) throw error;
      setBookings(data as any || []);
      setIsSupabaseOffline(false);
    } catch (err) {
      console.warn("Erro ao carregar agendamentos (Supabase offline/sem tabelas):", err);
      setIsSupabaseOffline(true);
      // Simulação offline de agendamento se necessário
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const fetchServices = async () => {
    setIsLoadingServices(true);
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setServices((data as any) || []);
      setIsSupabaseOffline(false);
    } catch (err) {
      console.warn("Erro ao carregar serviços (Supabase offline/sem tabelas):", err);
      setIsSupabaseOffline(true);
      setServices(STATIC_SERVICES_FALLBACK);
    } finally {
      setIsLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchServices();

    // Habilitar tempo real (realtime) para escutar inserções e alterações nos agendamentos
    const channel = supabase
      .channel("admin-bookings-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          fetchBookings();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "services" },
        () => {
          fetchServices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (bookingId: string, newStatus: "confirmed" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;
      
      toast.success(`Agendamento ${newStatus === "confirmed" ? "confirmado" : "cancelado"} com sucesso!`);
      // A atualização local será cuidada pelo canal Realtime, mas recarregamos por segurança
      fetchBookings();
    } catch (err) {
      toast.error("Não foi possível atualizar o agendamento offline.");
    }
  };

  const handleToggleService = async (serviceId: string, currentActive: boolean) => {
    if (isSupabaseOffline) {
      toast.error("Não é possível alterar serviços em modo offline.");
      return;
    }
    try {
      const { error } = await supabase
        .from("services")
        .update({ active: !currentActive })
        .eq("id", serviceId);

      if (error) throw error;
      toast.success("Status do serviço atualizado!");
      fetchServices();
    } catch (err) {
      toast.error("Erro ao atualizar o serviço.");
    }
  };

  const handleUpdatePrice = async (serviceId: string, name: string, currentPrice: number) => {
    if (isSupabaseOffline) {
      toast.error("Não é possível editar preços em modo offline.");
      return;
    }
    const rawPrice = prompt(`Defina o novo preço para ${name}:`, String(currentPrice));
    if (rawPrice === null) return;
    
    const parsedPrice = parseFloat(rawPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Por favor, digite um valor numérico válido.");
      return;
    }

    try {
      const { error } = await supabase
        .from("services")
        .update({ price: parsedPrice })
        .eq("id", serviceId);

      if (error) throw error;
      toast.success("Preço do serviço atualizado!");
      fetchServices();
    } catch (err) {
      toast.error("Erro ao atualizar o preço.");
    }
  };

  // Filtragem dos agendamentos
  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === "all") return true;
    return b.status === filterStatus;
  });

  // Estatísticas
  const totalAgendamentos = bookings.length;
  const pendentes = bookings.filter((b) => b.status === "pending").length;
  const confirmados = bookings.filter((b) => b.status === "confirmed").length;
  const faturamentoEstimado = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((acc, curr) => acc + (curr.services?.price || 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border pb-6 flex-wrap gap-4">
          <div className="space-y-1">
            <Link to="/" className="text-sm text-primary hover:underline flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Voltar para o Site
            </Link>
            <h1 className="font-display text-4xl tracking-wider flex items-center gap-2 mt-2">
              <Scissors className="w-6 h-6 text-primary animate-pulse" />
              PAINEL ADMIN · FABRÍCIO
            </h1>
            <p className="text-xs text-muted-foreground">Gerencie reservas e serviços em tempo real</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchBookings();
                fetchServices();
                toast.success("Dados recarregados!");
              }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Atualizar
            </Button>
          </div>
        </div>

        {/* ALERTA DE CONFIGURAÇÃO SUPABASE */}
        {isSupabaseOffline && (
          <div className="p-4 rounded-sm border border-destructive bg-destructive/10 text-destructive text-sm space-y-2">
            <p className="font-bold">⚠️ Supabase não configurado ou tabelas ausentes!</p>
            <p className="text-xs">
              O sistema detectou que a conexão com o Supabase falhou. Para conectar o banco de dados real:
            </p>
            <ol className="list-decimal pl-5 text-xs space-y-1">
              <li>Crie um projeto no Supabase.</li>
              <li>Configure o arquivo <code className="bg-background px-1 rounded">.env</code> na raiz do projeto com as chaves reais.</li>
              <li>Crie as tabelas executando o script SQL fornecido nas instruções do projeto.</li>
            </ol>
            <p className="text-xs font-semibold">Exibindo dados modelo estáticos para visualização.</p>
          </div>
        )}

        {/* METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total de Agendados</CardTitle>
              <Calendar className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAgendamentos}</div>
              <p className="text-xs text-muted-foreground">Agendamentos totais</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Pendentes</CardTitle>
              <Users className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{pendentes}</div>
              <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Confirmados</CardTitle>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">{confirmados}</div>
              <p className="text-xs text-muted-foreground">Clientes agendados</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Faturamento (Confirmados)</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">R$ {faturamentoEstimado}</div>
              <p className="text-xs text-muted-foreground">Garantidos no caixa</p>
            </CardContent>
          </Card>
        </div>

        {/* TABS CONTAINER */}
        <div className="space-y-4">
          <div className="flex border-b border-border gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`pb-2 transition cursor-pointer ${
                activeTab === "bookings"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📅 Agendamentos
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`pb-2 transition cursor-pointer ${
                activeTab === "services"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              💇‍♂️ Serviços
            </button>
          </div>

          {/* TAB 1: BOOKINGS MANAGEMENT */}
          {activeTab === "bookings" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 justify-between flex-wrap">
                <p className="text-sm text-muted-foreground font-medium">Lista de agendamentos solicitados:</p>
                <div className="flex gap-1.5">
                  {(["all", "pending", "confirmed", "cancelled"] as const).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={filterStatus === status ? "default" : "outline"}
                      onClick={() => setFilterStatus(status)}
                      className="text-xs rounded-sm capitalize"
                    >
                      {status === "all" ? "Todos" : status === "pending" ? "Pendentes" : status === "confirmed" ? "Confirmados" : "Cancelados"}
                    </Button>
                  ))}
                </div>
              </div>

              {isLoadingBookings ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredBookings.length === 0 ? (
                <Card className="bg-card border-border p-12 text-center text-muted-foreground">
                  Nenhum agendamento encontrado para este filtro.
                </Card>
              ) : (
                <div className="rounded-sm border border-border bg-card overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-semibold">{b.client_name}</TableCell>
                          <TableCell>
                            <a
                              href={`https://wa.me/${b.client_phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm font-semibold"
                            >
                              {b.client_phone}
                            </a>
                          </TableCell>
                          <TableCell>{b.services?.name || "Serviço Não Identificado"}</TableCell>
                          <TableCell>{format(new Date(b.booking_date + "T00:00:00"), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="font-semibold text-primary">{b.booking_time.slice(0, 5)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                b.status === "confirmed"
                                  ? "border-emerald-500 text-emerald-500 bg-emerald-500/5"
                                  : b.status === "cancelled"
                                  ? "border-destructive text-destructive bg-destructive/5"
                                  : "border-amber-500 text-amber-500 bg-amber-500/5"
                              }
                            >
                              {b.status === "confirmed" ? "Confirmado" : b.status === "cancelled" ? "Cancelado" : "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {b.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-emerald-500 hover:bg-emerald-500/10 text-emerald-500"
                                  onClick={() => handleUpdateStatus(b.id, "confirmed")}
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-destructive hover:bg-destructive/10 text-destructive"
                                  onClick={() => handleUpdateStatus(b.id, "cancelled")}
                                >
                                  Recusar
                                </Button>
                              </>
                            )}
                            {b.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-destructive hover:bg-destructive/10 text-destructive"
                                onClick={() => handleUpdateStatus(b.id, "cancelled")}
                              >
                                Cancelar
                              </Button>
                            )}
                            {b.status === "cancelled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-emerald-500 hover:bg-emerald-500/10 text-emerald-500"
                                onClick={() => handleUpdateStatus(b.id, "confirmed")}
                              >
                                Reativar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SERVICES MANAGEMENT */}
          {activeTab === "services" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-medium">Habilite, edite preços ou controle o catálogo:</p>

              {isLoadingServices ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {services.map((s) => (
                    <Card key={s.id} className={`bg-card border-border transition ${!s.active ? "opacity-60" : ""}`}>
                      <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                        <div>
                          <CardTitle className="font-display text-2xl tracking-wide">{s.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">{s.duration_minutes} min — {s.description}</CardDescription>
                        </div>
                        <Badge variant={s.active ? "default" : "outline"} className={s.active ? "bg-primary" : "text-muted-foreground"}>
                          {s.active ? "Ativo" : "Pausado"}
                        </Badge>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="text-lg font-bold text-primary">R$ {s.price}</div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 h-8"
                            onClick={() => handleUpdatePrice(s.id, s.name, s.price)}
                          >
                            <PriceIcon className="w-3.5 h-3.5" /> Preço
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`gap-1 h-8 ${s.active ? "border-amber-500/50 hover:bg-amber-500/10 text-amber-500" : "border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-500"}`}
                            onClick={() => handleToggleService(s.id, s.active)}
                          >
                            <Power className="w-3.5 h-3.5" /> {s.active ? "Pausar" : "Ativar"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
