import { createFileRoute } from "@tanstack/react-router";
import { Scissors, MapPin, Phone, Clock, Instagram, Star } from "lucide-react";
import heroImg from "@/assets/hero-barbershop.jpg";
import barberImg from "@/assets/barber-fabricio.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

const services = [
  { name: "Corte Degradê", price: "R$ 30", desc: "Máquina, tesoura e finalização com navalha." },
  { name: "Barba", price: "R$ 25", desc: "Barba alinhada e acabamento perfeito." },
  { name: "Combo", price: "R$ 45", desc: "Corte de cabelo + barba." },
  { name: "Pigmentação", price: "R$ 70", desc: "Preenchimento e disfarce natural." },
  { name: "Sobrancelha", price: "R$ 20", desc: "Design masculino sob medida." },
  { name: "Platinado", price: "R$ 180", desc: "Descoloração premium com hidratação." },
];

const testimonials = [
  { name: "Rafael M.", text: "Melhor barbearia da região. Fabricio manda muito na navalha." },
  { name: "Diego S.", text: "Ambiente top, atendimento nota 10. Virei cliente fiel." },
  { name: "Lucas P.", text: "Sai de lá parecendo outra pessoa. Recomendo demais." },
];

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
          <a href="#contato" className="rounded-sm bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition">
            Agendar
          </a>
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
            <a href="#contato" className="rounded-sm bg-primary text-primary-foreground px-8 py-4 font-semibold hover:opacity-90 transition" style={{ boxShadow: "var(--shadow-glow)" }}>
              Agendar horário
            </a>
            <a href="#servicos" className="rounded-sm border border-border px-8 py-4 font-semibold hover:bg-secondary transition">
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
            {services.map((s) => (
              <div key={s.name} className="bg-card p-8 hover:bg-secondary transition group">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="font-display text-2xl tracking-wide">{s.name}</h3>
                  <span className="text-primary font-semibold">{s.price}</span>
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
          <a
            href="https://wa.me/5511999999999"
            className="inline-block rounded-sm bg-primary text-primary-foreground px-10 py-5 font-semibold text-lg hover:opacity-90 transition"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            Agendar pelo WhatsApp
          </a>
          <div className="mt-16 grid md:grid-cols-3 gap-8 text-left">
            <div className="flex gap-4">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-semibold mb-1">Endereço</p>
                <p className="text-sm text-muted-foreground">Rua das Tesouras, 123<br />Vila Madalena, São Paulo</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Clock className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-semibold mb-1">Horário</p>
                <p className="text-sm text-muted-foreground">Ter–Sáb: 9h às 20h<br />Dom–Seg: fechado</p>
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
