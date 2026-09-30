import React from "react";
import { ArrowUpRight, Minus, Plus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/Reveal";

const faqItems = [
  {
    question: "Quais são as formas de pagamento e vigência dos planos?",
    answer: "Nossos planos são individuais, no formato de assinatura com cobrança recorrente em cartão de crédito/débito, ou pagamento à vista via boleto. As mensalidades têm vigência de 30 dias a partir da data da compra e sua assinatura permanece ativa até a solicitação de cancelamento.",
  },
  {
    question: "Qual a diferença entre os planos Izi One e Izi Prime?",
    answer: "O Izi One é focado na unidade de matrícula (musculação e estúdio) e não possui permanência mínima. O Izi Prime permite treinar em qualquer unidade, inclui Izi Cycle, Bioimpedância, cadeira de massagem, 5 convidados por mês e possui fidelidade de 12 meses.",
  },
  {
    question: "Como funciona o processo de cancelamento?",
    answer: "O cancelamento deve ser solicitado pessoalmente na recepção para assinatura do termo. Planos com fidelidade (como o Izi Prime) têm multa de 20% sobre as mensalidades restantes se cancelados antes do prazo. Planos promocionais exigem permanência mínima de 4 meses para manter o benefício.",
  },
  {
    question: "Posso trancar minha matrícula?",
    answer: "O trancamento é permitido apenas por razões médicas, mediante apresentação de atestado no início da licença. O procedimento não é retroativo.",
  },
  {
    question: "A academia tem estacionamento?",
    answer: "Sim, oferecemos estacionamento no condomínio com isenção de 2 horas para clientes. Após esse período, a tabela do administrador local é aplicada.",
  },
  {
    question: "Como funcionam os armários e vestiários?",
    answer: "Disponibilizamos armários rotativos (traga seu cadeado) para uso durante o treino. Itens deixados após o treino são doados. Nossos vestiários são completos e possuem duchas aquecidas.",
  },
  {
    question: "A academia possui acessibilidade?",
    answer: "Sim, nossas unidades contam com elevadores que garantem acesso desde o estacionamento até as áreas de treino.",
  },
  {
    question: "O que é o Izi Relax?",
    answer: "É um espaço exclusivo para clientes Izi Prime com cadeiras de massagem programadas para sessões de 5 minutos.",
  },
  {
    question: "Posso treinar um dia para experimentar?",
    answer: "Não trabalhamos com free pass. Clientes Izi Prime podem levar um convidado até 5 vezes por mês. O registro deve ser feito antecipadamente via app ou recepção, e o convidado deve estar acompanhado do titular.",
  },
  {
    question: "Quais são os horários de funcionamento?",
    answer: "Segunda a sexta: 05:00 às 23:00. Sábados e domingos: 08:00 às 20:00. Consulte o horário de feriados em nossas redes sociais.",
  },
  {
    question: "Quais são os preços dos planos?",
    answer: "Izi One: R$ 157,00 por mês. Izi Prime: R$ 27,00 no primeiro mês e R$ 167,00 por mês a partir do segundo mês.",
  },
];

const FaqList = ({ items }: { items: typeof faqItems }) => (
  <Accordion type="single" collapsible className="w-full space-y-3">
    {items.map((item, index) => (
      <AccordionItem
        key={index}
        value={`item-${index}`}
        className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 sm:px-5 transition-all duration-500 ease-soft hover:border-white/20 hover:bg-white/[0.055]"
      >
        <AccordionTrigger className="group/trigger py-4 sm:py-5 text-left hover:no-underline [&>svg:last-child]:hidden">
          <span className="flex items-center gap-3 sm:gap-4">
            <span className="hidden text-xs font-bold tabular-nums tracking-[0.18em] text-primary/80 sm:block">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-sm sm:text-base font-semibold leading-snug text-white transition-colors duration-500 ease-soft group-hover:text-zinc-100">
              {item.question}
            </span>
          </span>
          <span className="ml-3 sm:ml-5 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-primary transition-all duration-500 ease-soft group-hover:border-primary/30 group-hover:bg-primary/10">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-500 ease-soft group-data-[state=open]/trigger:rotate-45 group-data-[state=open]/trigger:opacity-0" />
            <Minus className="absolute h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-0 transition-all duration-500 ease-soft group-data-[state=open]/trigger:opacity-100" />
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-5 pl-0 text-sm sm:text-base leading-relaxed text-zinc-400 sm:pl-12 sm:pr-12">
          {item.answer}
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

export const FAQSection = () => {
  return (
    <section className="bg-section-gray px-5 sm:px-6 py-16 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 lg:gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <Reveal className="lg:sticky lg:top-28">
          <span className="mb-4 sm:mb-5 block text-[11px] sm:text-xs uppercase tracking-[0.28em] sm:tracking-[0.3em] text-zinc-500">
            Perguntas frequentes
          </span>
          <h2 className="max-w-xl text-4xl font-bold leading-tight text-white md:text-6xl">
            Antes de começar, resolva o essencial.
          </h2>
          <p className="mt-5 sm:mt-6 max-w-md text-base sm:text-lg leading-relaxed text-zinc-400">
            Reunimos as respostas que costumam decidir matrícula, rotina e uso da estrutura.
          </p>

          <div className="mt-7 sm:mt-9 flex flex-wrap gap-2">
            {["Planos", "Estrutura", "Rotina"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400"
              >
                {label}
              </span>
            ))}
          </div>

          <a
            href="https://wa.me/5511952137022"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 sm:mt-10 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-primary transition-all duration-500 ease-soft hover:border-primary/60 hover:bg-primary/15"
          >
            Falar com a equipe
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </Reveal>

        <Reveal delay={120}>
          <FaqList items={faqItems} />
        </Reveal>
      </div>
    </section>
  );
};
