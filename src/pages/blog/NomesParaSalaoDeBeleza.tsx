import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";

type NameGroup = {
  title: string;
  intro: string;
  names: string[];
};

const groups: NameGroup[] = [
  {
    title: "Nomes elegantes e sofisticados",
    intro:
      "Funcionam bem para salões com ticket médio mais alto, atendimento por hora marcada e ambiente intimista.",
    names: [
      "Maison Belle",
      "Atelier da Beleza",
      "Casa Lumière",
      "Studio Aurora",
      "Belle Époque Beauty",
      "Éclat Studio",
      "Villa Rosé",
      "Nuance Beauty House",
      "Suprema Estética",
      "Ateliê Camélia",
    ],
  },
  {
    title: "Nomes modernos e minimalistas",
    intro:
      "Curtos, fáceis de lembrar e ótimos para redes sociais — combinam com identidade visual limpa e público jovem.",
    names: [
      "Studio Nu",
      "Prisma Beauty",
      "Forma Studio",
      "Lume",
      "Orbe Beauty",
      "Nove Studio",
      "Cru Beauty Lab",
      "Nome Studio",
      "Base Beleza",
      "Vértice Beauty",
    ],
  },
  {
    title: "Nomes criativos e divertidos",
    intro:
      "Boa escolha para quem quer se destacar com humor e personalidade, especialmente em bairros com muita concorrência.",
    names: [
      "Corte & Cia",
      "Papo de Salão",
      "Cabelo na Régua",
      "Xodó Beauty",
      "Divas do Bairro",
      "Fio Condutor",
      "Mão na Massa Beauty",
      "Reboot Hair",
      "Bem-me-quer Studio",
      "Café com Beleza",
    ],
  },
  {
    title: "Nomes para nail designer e manicure",
    intro:
      "Reforçam a especialidade em unhas — importante quando a agenda é focada em alongamento, esmaltação em gel e nail art.",
    names: [
      "Unha Boa",
      "Nail Atelier",
      "Esmalte & Poesia",
      "Studio Unhas de Luz",
      "Gel & Glitter",
      "Ponta dos Dedos",
      "Nail House",
      "Cutícula Studio",
      "Dedo de Prosa Nails",
      "Alongue Nail Bar",
    ],
  },
  {
    title: "Nomes para design de sobrancelhas e cílios",
    intro:
      "Deixam claro o serviço principal e ajudam quem busca por “designer de sobrancelhas perto de mim”.",
    names: [
      "Olhar Studio",
      "Arco Perfeito",
      "Brow House",
      "Design do Olhar",
      "Cílios & Companhia",
      "Traço Studio",
      "Moldura Brows",
      "Lash Atelier",
      "Sobrancelha Viva",
      "Ponto de Vista Beauty",
    ],
  },
  {
    title: "Nomes com o seu próprio nome",
    intro:
      "Constroem marca pessoal — indicados para profissionais autônomas que já têm clientela fiel e indicações.",
    names: [
      "Studio Ana Paula",
      "Camila Beauty Room",
      "Espaço Juliana Alves",
      "Bia Nails Studio",
      "Marina Brow Design",
      "Casa da Rê",
      "Lu Beauty Space",
      "Studio Duda Hair",
      "Ateliê da Karina",
      "Espaço Belle by Fernanda",
    ],
  },
];

const checklist = [
  "Fácil de falar e de escrever: se a cliente erra ao digitar no Instagram, ela não te acha.",
  "Curto: até 3 palavras funciona melhor em placa, bio e link de agendamento.",
  "Disponível: confira o @ no Instagram, o domínio e a busca do Google antes de decidir.",
  "Sem conflito: pesquise a marca no INPI para evitar registro já existente na sua classe.",
  "Coerente com o serviço: se você é especialista em unhas, o nome pode dizer isso.",
  "Durável: evite modismos e o nome do bairro se você pretende mudar de endereço.",
];

const steps = [
  {
    title: "1. Defina o posicionamento",
    text: "Escreva em uma frase para quem você atende e qual o diferencial (preço, especialidade, atendimento em casa, horário estendido). O nome nasce dessa frase.",
  },
  {
    title: "2. Faça uma lista de 20 opções",
    text: "Misture palavras do universo da beleza com palavras de sensação (luz, calma, brilho, cuidado). Não filtre nada nessa etapa.",
  },
  {
    title: "3. Teste em voz alta",
    text: "Fale o nome ao telefone e peça para três pessoas escreverem o que ouviram. O que for escrito errado sai da lista.",
  },
  {
    title: "4. Verifique disponibilidade",
    text: "Instagram, Google, domínio e busca de marcas no INPI. Reserve tudo no mesmo dia para não perder o @.",
  },
  {
    title: "5. Aplique na prática",
    text: "Coloque o nome na bio, no link de agendamento e nas confirmações por e-mail. Consistência é o que transforma nome em marca.",
  },
];

export default function NomesParaSalaoDeBeleza() {
  usePageMeta({
    title: "Nomes para salão de beleza: 60 ideias criativas e como escolher",
    description:
      "60 ideias de nomes para salão de beleza, nail studio e design de sobrancelhas, com checklist de disponibilidade e passo a passo para escolher o seu.",
    path: "/blog/nomes-para-salao-de-beleza",
    ogType: "article",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Nomes para salão de beleza: 60 ideias criativas e como escolher",
    inLanguage: "pt-BR",
    author: { "@type": "Organization", name: "Belle Nails" },
    publisher: { "@type": "Organization", name: "Belle Nails" },
    mainEntityOfPage: "https://bellenailsapp.com/blog/nomes-para-salao-de-beleza",
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b border-border/50">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <span className="font-display text-lg">Belle Nails</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 sm:py-14">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Guia</p>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight mb-4">
          Nomes para salão de beleza: 60 ideias criativas e como escolher
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-4">
          O nome do salão é a primeira coisa que a cliente lê na placa, na bio do Instagram e no link
          de agendamento. Reunimos 60 ideias organizadas por estilo e especialidade, além de um
          checklist prático para você confirmar se o nome escolhido está livre antes de investir em
          identidade visual.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-10">
          Use a lista como ponto de partida: adapte, combine palavras e teste com as clientes que já
          te acompanham.
        </p>

        <section className="mb-12">
          <h2 className="font-display text-2xl mb-4">60 ideias de nomes por estilo</h2>
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="font-display text-lg mb-1">{group.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{group.intro}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {group.names.map((name) => (
                    <li
                      key={name}
                      className="text-sm text-foreground/90 border-b border-border/40 py-1.5"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl mb-4">Checklist antes de fechar o nome</h2>
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-4">
            A consulta de marcas pode ser feita gratuitamente na busca do{" "}
            <a
              className="underline"
              href="https://busca.inpi.gov.br/pePI/"
              target="_blank"
              rel="noreferrer"
            >
              INPI
            </a>
            .
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl mb-4">Passo a passo para escolher</h2>
          <ol className="space-y-4">
            {steps.map((step) => (
              <li key={step.title}>
                <p className="font-medium text-sm mb-1">{step.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl mb-2">Escolheu o nome? Monte a agenda online</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            Com a Belle Nails você cria um link de agendamento com o nome do seu salão, controla
            horários por profissional e envia confirmações e lembretes por e-mail automaticamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link to="/auth">
                Começar teste grátis <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/precos">Ver planos e preços</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Belle Nails
      </footer>
    </div>
  );
}
