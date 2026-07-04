import { createFileRoute } from "@tanstack/react-router";
import { Scissors, MapPin, Phone, Clock, Instagram, Star, CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import heroImg from "@/assets/hero-barbershop.jpg";
import barberImg from "@/assets/barber-fabricio.jpg";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  component: Index,
});

const FALLBACK_SERVICES = [
  { id: "1", name: "Corte Degradê", price: "30", desc: "Máquina, tesoura e finalização com navalha.", duration_minutes: 30 },
  { id: "2", name: "Barba", price: "20", desc: "Barba alinhada e acabamento perfeito.", duration_minutes: 30 },
  { id: "3", name: "Combo", price: "40", desc: "Corte de cabelo + barba.", duration_minutes: 60 },
  { id: "4", name: "Pigmentação", price: "60", desc: "Preenchimento e disfarce natural.", duration_minutes: 45 },
  { id: "5", name: "Toalha Quente", price: "03", desc: "Ritual relaxante com toalha quente.", duration_minutes: 15 },
  { id: "6", name: "Alisamento", price: "50", desc: "Alisamento capilar com acabamento premium.", duration_minutes: 90 },
];

const testimonials = [
  { name: "Rafael M.", text: "Melhor barbearia da região. Fabricio manda muito na navalha." },
  { name: "Diego S.", text: "Ambiente top, atendimento nota 10. Virei cliente fiel." },
  { name: "Lucas P.", text: "Sai de lá parecendo outra pessoa. Recomendo demais." },
];

const ALL_TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30"
];

function BookingModal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [dbServices, setDbServices] = useState(FALLBACK_SERVICES);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");

  // Carregar serviços ativos do Supabase
  useEffect(() => {
    if (!isOpen) return;

    const fetchServices = async () => {
      setIsLoadingServices(true);
      try {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("active", true)
          .order("price", { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          // Normalizar preços decimais para string
          const formatted = data.map((s: any) => ({
            id: s.id,
            name: s.name,
            price: String(Math.round(s.price)),
            desc: s.description || "",
            duration_minutes: s.duration_minutes
          }));
          setDbServices(formatted);
        } else {
          setDbServices(FALLBACK_SERVICES);
        }
      } catch (err) {
        console.warn("Usando serviços fallback offline:", err);
        setDbServices(FALLBACK_SERVICES);
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, [isOpen]);

  // Carregar agendamentos do dia selecionado
  useEffect(() => {
    if (!selectedDate) return;

    const fetchBookedSlots = async () => {
      setIsLoadingSlots(true);
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("booking_time")
          .eq("booking_date", formattedDate)
          .neq("status", "cancelled");

        if (error) throw error;
        if (data) {
          // Extrair HH:MM
          const slots = data.map((b: any) => b.booking_time.slice(0, 5));
          setBookedSlots(slots);
        } else {
          setBookedSlots([]);
        }
      } catch (err) {
        console.warn("Erro ao buscar horários ocupados, simulando slots livres:", err);
        setBookedSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [selectedDate]);

  // Resetar o modal ao fechar/abrir
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Esperar fechar animação
      setTimeout(() => {
        setStep(1);
        setSelectedServiceId("");
        setSelectedDate(undefined);
        setSelectedTime("");
        setClientName("");
        setClientPhone("");
        setIsSuccess(false);
        setWhatsappLink("");
      }, 200);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedServiceId || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsSubmitting(true);
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const formattedTime = `${selectedTime}:00`;
    const service = dbServices.find(s => s.id === selectedServiceId);

    try {
      // 1. Inserir no Supabase
      const { error } = await supabase
        .from("bookings")
        .insert([
          {
            client_name: clientName,
            client_phone: clientPhone,
            service_id: selectedServiceId,
            booking_date: formattedDate,
            booking_time: formattedTime,
            status: "pending"
          }
        ]);

      if (error) throw error;

      toast.success("Agendamento reservado com sucesso!");
      setIsSuccess(true);

      // 2. Gerar link do WhatsApp
      const message = `Olá Fabrício! Gostaria de confirmar meu agendamento:
💇‍♂️ *Serviço:* ${service?.name}
💵 *Valor:* R$ ${service?.price}
📅 *Data:* ${format(selectedDate, "dd/MM/yyyy")}
⏰ *Horário:* ${selectedTime}
👤 *Cliente:* ${clientName}
📱 *Contato:* ${clientPhone}`;

      const encodedMessage = encodeURIComponent(message);
      // Número padrão de atendimento
      const whatsappNumber = "5511999999999";
      setWhatsappLink(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`);

    } catch (err: any) {
      console.error("Erro ao realizar agendamento:", err);
      if (err.code === "23505") {
        toast.error("Desculpe, este horário acabou de ser reservado. Escolha outro slot, por favor.");
        if (selectedDate) {
          // Atualizar ocupados
          const formattedDate = format(selectedDate, "yyyy-MM-dd");
          const { data } = await supabase
            .from("bookings")
            .select("booking_time")
            .eq("booking_date", formattedDate)
            .neq("status", "cancelled");
          if (data) {
            setBookedSlots(data.map((b: any) => b.booking_time.slice(0, 5)));
          }
        }
      } else {
        // Fallback off-line para WhatsApp
        toast.warning("Banco off-line. Redirecionando direto para o WhatsApp para confirmar!");
        setIsSuccess(true);
        const message = `Olá Fabrício! Gostaria de agendar:
💇‍♂️ *Serviço:* ${service?.name}
📅 *Data:* ${format(selectedDate, "dd/MM/yyyy")}
⏰ *Horário:* ${selectedTime}
👤 *Cliente:* ${clientName}
📱 *Contato:* ${clientPhone}`;
        const encodedMessage = encodeURIComponent(message);
        setWhatsappLink(`https://wa.me/5511999999999?text=${encodedMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar slots no passado (se for hoje)
  const getFilteredTimeSlots = () => {
    if (!selectedDate) return [];
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return ALL_TIME_SLOTS.filter(slot => {
      // Remover se já estiver ocupado
      if (bookedSlots.includes(slot)) return false;

      // Se for hoje, remover horários passados
      if (isToday) {
        const [slotHour, slotMinute] = slot.split(":").map(Number);
        if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute)) {
          return false;
        }
      }

      return true;
    });
  };

  const availableSlots = getFilteredTimeSlots();
  const selectedService = dbServices.find(s => s.id === selectedServiceId);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-card border border-border text-foreground overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl tracking-wide flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            AGENDAMENTO
          </DialogTitle>
        </DialogHeader>

        {/* Indicador de Passos */}
        {!isSuccess && (
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b border-border pb-4 mb-4">
            <span className={step === 1 ? "text-primary border-b border-primary pb-1" : ""}>1. Serviço</span>
            <span className={step === 2 ? "text-primary border-b border-primary pb-1" : ""}>2. Data e Hora</span>
            <span className={step === 3 ? "text-primary border-b border-primary pb-1" : ""}>3. Seus Dados</span>
          </div>
        )}

        {/* STEP 1: Escolha do Serviço */}
        {step === 1 && !isSuccess && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Escolha o serviço desejado:</p>
            {isLoadingServices ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {dbServices.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`w-full text-left p-4 rounded-sm border transition flex justify-between items-center group cursor-pointer ${selectedServiceId === s.id
                      ? "bg-secondary border-primary"
                      : "bg-background/50 border-border hover:bg-secondary/40"
                      }`}
                  >
                    <div>
                      <h4 className="font-semibold group-hover:text-primary transition">{s.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">{s.desc}</p>
                    </div>
                    <span className="text-primary font-bold">R$ {s.price}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button
                disabled={!selectedServiceId}
                onClick={() => setStep(2)}
                className="w-full sm:w-auto"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Escolha de Data e Hora */}
        {step === 2 && !isSuccess && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 items-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  setSelectedDate(d);
                  setSelectedTime(""); // Reset time on date change
                }}
                disabled={(date) => {
                  const day = date.getDay();
                  const isPast = isBefore(startOfDay(date), startOfDay(new Date()));
                  return day === 0 || day === 1 || isPast; // Bloquear Dom, Seg e passados
                }}
                locale={ptBR}
                className="rounded-sm border border-border bg-background/30 w-full flex justify-center"
              />

              {selectedDate && (
                <div className="w-full space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Horários Disponíveis para {format(selectedDate, "dd/MM")}:</Label>
                  {isLoadingSlots ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-destructive text-center py-4">Nenhum horário disponível para este dia.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`p-2 text-xs font-semibold rounded-sm border transition text-center cursor-pointer ${selectedTime === slot
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background/60 border-border hover:bg-secondary"
                            }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Dados de Contato */}
        {step === 3 && !isSuccess && (
          <div className="space-y-4">
            <div className="bg-secondary/40 p-4 rounded-sm border border-border text-sm space-y-1">
              <p className="text-muted-foreground">Resumo do pedido:</p>
              <p className="font-bold text-primary">{selectedService?.name} — R$ {selectedService?.price}</p>
              <p className="text-xs text-muted-foreground">
                📅 {selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ""} às {selectedTime}
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="client-name">Seu Nome Completo</Label>
                <Input
                  id="client-name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="bg-background border-border focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="client-phone">Seu WhatsApp</Label>
                <Input
                  id="client-phone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Ex: (81) 99999-9999"
                  className="bg-background border-border focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                disabled={!clientName || !clientPhone || isSubmitting}
                onClick={handleConfirmBooking}
                className="gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar Agendamento
              </Button>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {isSuccess && (
          <div className="text-center py-6 space-y-6 flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-primary animate-bounce" />
            <div className="space-y-2">
              <h3 className="font-display text-3xl text-foreground">Horário Reservado!</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Seu agendamento foi registrado com sucesso no banco de dados. Agora, confirme via WhatsApp para finalizar!
              </p>
            </div>

            <div className="bg-secondary/40 p-4 rounded-sm border border-border text-sm text-left w-full space-y-1">
              <p className="font-semibold text-primary">{selectedService?.name}</p>
              <p className="text-xs text-muted-foreground">
                📅 {selectedDate ? format(selectedDate, "dd/MM/yyyy") : ""} às {selectedTime}
              </p>
              <p className="text-xs text-muted-foreground">👤 Cliente: {clientName}</p>
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-4 px-6 rounded-sm text-center transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Phone className="w-5 h-5 fill-current" />
              Enviar Confirmação no WhatsApp
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-2 font-display text-2xl tracking-widest">
            <Scissors className="w-5 h-5 text-primary" />
            FABRICIO
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#servicos" className="hover:text-foreground transition">Serviços</a>
            <a href="#sobre" className="hover:text-foreground transition">Sobre</a>
            <a href="#depoimentos" className="hover:text-foreground transition">Depoimentos</a>
            <a href="#contato" className="hover:text-foreground transition">Contato</a>
          </div>
          <BookingModal>
            <Button size="sm" className="rounded-sm font-semibold cursor-pointer">
              Agendar
            </Button>
          </BookingModal>
        </nav>
      </header>

      {/* HERO */}
      <section id="top" className="relative min-h-screen flex items-end pb-20 overflow-hidden">
        <img
          src={heroImg}
          alt="Interior da Barbearia Fabricio"
          width={1600}
          height={1200}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative max-w-6xl mx-auto px-6 w-full">
          <p className="text-primary tracking-[0.3em] text-xs mb-4">DESDE 2021 · ESCADA - PE</p>
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-none max-w-4xl">
            Barbearia<br />Fabrício
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Cortes clássicos, barba desenhada e um ritual masculino que vai muito além da estética.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <BookingModal>
              <Button size="lg" className="rounded-sm font-semibold cursor-pointer" style={{ boxShadow: "var(--shadow-glow)" }}>
                Agendar horário
              </Button>
            </BookingModal>
            <a href="#servicos" className="rounded-sm border border-border px-8 py-4 font-semibold hover:bg-secondary transition flex items-center justify-center">
              Ver serviços
            </a>
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-16 flex-wrap gap-6">
            <div>
              <p className="text-primary tracking-[0.3em] text-xs mb-3">O QUE FAZEMOS</p>
              <h2 className="font-display text-5xl md:text-7xl">Serviços</h2>
            </div>
            <p className="max-w-md text-muted-foreground">
              Cada serviço é executado com atenção aos detalhes e produtos premium. Você entra homem, sai lenda.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {FALLBACK_SERVICES.map((s) => (
              <div key={s.name} className="bg-card p-8 hover:bg-secondary transition group">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="font-display text-2xl tracking-wide">{s.name}</h3>
                  <span className="text-primary font-semibold">R$ {s.price}</span>
                </div>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-28 px-6 bg-card">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <img
              src={barberImg}
              alt="Fabricio, barbeiro fundador"
              width={1000}
              height={1200}
              loading="lazy"
              className="w-full h-[600px] object-cover rounded-sm"
            />
            <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-sm hidden md:block">
              <p className="font-display text-4xl">10+</p>
              <p className="text-xs tracking-widest">ANOS DE OFÍCIO</p>
            </div>
          </div>
          <div>
            <p className="text-primary tracking-[0.3em] text-xs mb-3">SOBRE O MESTRE</p>
            <h2 className="font-display text-5xl md:text-6xl mb-6">Fabricio,<br />o barbeiro.</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Nascido e criado no ofício, Fabricio aprendeu com o avô o valor de uma boa navalha e de uma conversa franca.
              Há mais de uma década, transforma cortes em rituais.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Cada cliente que passa pela cadeira sai não só com o visual renovado, mas com aquela sensação boa de
              quem foi bem cuidado. Aqui não é só corte de cabelo — é experiência.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6 border-t border-border pt-8">
              <div>
                <p className="font-display text-3xl text-primary">5K+</p>
                <p className="text-xs text-muted-foreground tracking-widest mt-1">CLIENTES</p>
              </div>
              <div>
                <p className="font-display text-3xl text-primary">4.9</p>
                <p className="text-xs text-muted-foreground tracking-widest mt-1">AVALIAÇÃO</p>
              </div>
              <div>
                <p className="font-display text-3xl text-primary">100%</p>
                <p className="text-xs text-muted-foreground tracking-widest mt-1">PREMIUM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-primary tracking-[0.3em] text-xs mb-3 text-center">QUEM PASSOU, APROVOU</p>
          <h2 className="font-display text-5xl md:text-6xl text-center mb-16">Depoimentos</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card p-8 rounded-sm border border-border">
                <div className="flex gap-1 mb-4 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">"{t.text}"</p>
                <p className="font-semibold text-sm tracking-wide">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / CONTATO */}
      <section id="contato" className="py-28 px-6 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-primary tracking-[0.3em] text-xs mb-3">VEM PRA CADEIRA</p>
          <h2 className="font-display text-5xl md:text-7xl mb-6">Bora marcar?</h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Reserve seu horário pelo WhatsApp ou passe direto na barbearia. Estamos te esperando.
          </p>
          <BookingModal>
            <Button size="lg" className="px-10 py-7 text-lg rounded-sm font-semibold cursor-pointer" style={{ boxShadow: "var(--shadow-glow)" }}>
              Agendar pelo WhatsApp
            </Button>
          </BookingModal>
          <div className="mt-16 grid md:grid-cols-3 gap-8 text-left">
            <div className="flex gap-4">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-semibold mb-1">Endereço</p>
                <p className="text-sm text-muted-foreground">Av. José Mário Leite<br />(Ao lado do Sesi)</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Clock className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-semibold mb-1">Horário</p>
                <p className="text-sm text-muted-foreground">Seg–Sáb: 9h às 20h<br />Dom: fechado</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Phone className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-semibold mb-1">Contato</p>
                <p className="text-sm text-muted-foreground">(11) 99999-9999<br />contato@fabricio.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p className="font-display text-xl tracking-widest flex items-center gap-2">
            <Scissors className="w-4 h-4 text-primary" /> FABRICIO
          </p>
          <p className="text-xs text-muted-foreground">© 2026 Barbearia Fabricio. Todos os direitos reservados.</p>
          <a href="#" className="text-muted-foreground hover:text-primary transition">
            <Instagram className="w-5 h-5" />
          </a>
        </div>
      </footer>
    </div>
  );
}
