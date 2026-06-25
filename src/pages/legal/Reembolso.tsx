import { LegalLayout } from "./LegalLayout";

export default function Reembolso() {
  return (
    <LegalLayout title="Política de Reembolso">
      <h2>Garantia de 30 dias</h2>
      <p>
        A <strong>Belle Nails</strong> oferece uma garantia de satisfação de <strong>30 dias</strong>.
        Se você não estiver satisfeita com sua assinatura, pode solicitar reembolso integral em até
        30 dias contados a partir da data da cobrança.
      </p>

      <h2>Como solicitar</h2>
      <p>
        Os reembolsos são processados pelo nosso provedor de pagamento, <strong>Paddle</strong>, que
        atua como Merchant of Record (MoR) dos nossos pedidos.
      </p>
      <ul>
        <li>
          Acesse <a href="https://paddle.net" target="_blank" rel="noreferrer">paddle.net</a> e
          informe o e-mail utilizado na compra para localizar a fatura e abrir a solicitação; ou
        </li>
        <li>Entre em contato com o nosso suporte dentro do aplicativo e ajudaremos no processo.</li>
      </ul>

      <h2>Prazo de processamento</h2>
      <p>
        Após a aprovação, o estorno costuma ser realizado em alguns dias úteis, dependendo do meio
        de pagamento utilizado.
      </p>

      <h2>Cancelamento</h2>
      <p>
        Você pode cancelar sua assinatura a qualquer momento. O cancelamento interrompe as próximas
        renovações; o período já pago permanece ativo até o fim do ciclo, salvo quando aplicável o
        reembolso descrito acima.
      </p>
    </LegalLayout>
  );
}
