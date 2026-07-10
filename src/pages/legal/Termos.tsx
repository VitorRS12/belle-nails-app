import { LegalLayout } from "./LegalLayout";

export default function Termos() {
  return (
    <LegalLayout title="Termos de Uso">
      <h2>1. Identificação do prestador</h2>
      <p>
        Este serviço é operado por <strong>Edelson Vitor dos Santos Dutra</strong>, pessoa física
        inscrita no CPF sob o nº <strong>065.235.185-90</strong>, que atua comercialmente sob o
        nome <strong>Belle Nails</strong> ("Belle Nails", "nós"). Ao utilizar a plataforma, você
        celebra um contrato diretamente com Edelson Vitor dos Santos Dutra (Belle Nails).
      </p>

      <h2>2. Aceitação</h2>
      <p>
        Ao criar uma conta ou continuar utilizando a Belle Nails, você declara ter lido, compreendido
        e concordado com estes Termos. Se não concorda, por favor não utilize o serviço.
      </p>

      <h2>3. Descrição do serviço</h2>
      <p>
        A Belle Nails é uma plataforma SaaS de agendamento e gestão para profissionais e estúdios de
        estética (manicure, cílios, sobrancelhas), incluindo agenda online, cadastro de clientes,
        notificações e relatórios.
      </p>

      <h2>4. Conta e responsabilidades do usuário</h2>
      <ul>
        <li>Você deve fornecer informações verdadeiras e mantê-las atualizadas.</li>
        <li>Você é responsável por manter a confidencialidade das credenciais e por toda atividade na sua conta.</li>
        <li>Se contrata em nome de uma empresa, declara ter autoridade para vinculá-la a estes Termos.</li>
      </ul>

      <h2>5. Uso aceitável</h2>
      <p>Você concorda em não:</p>
      <ul>
        <li>Utilizar o serviço para qualquer finalidade ilegal, fraudulenta ou enganosa;</li>
        <li>Enviar spam, conteúdo que viole direitos de terceiros ou propriedade intelectual;</li>
        <li>Interferir na segurança do serviço (malware, varreduras, scraping não autorizado);</li>
        <li>Realizar engenharia reversa, revender ou redistribuir o serviço.</li>
      </ul>

      <h2>6. Propriedade intelectual</h2>
      <p>
        Todo o software, marca, documentação e identidade visual da Belle Nails permanecem de
        propriedade exclusiva da Belle Nails. Concedemos a você uma licença limitada, não exclusiva
        e intransferível para utilizar o serviço dentro do plano contratado.
      </p>

      <h2>7. Conteúdo do usuário</h2>
      <p>
        Você mantém a titularidade dos dados que insere (clientes, agendamentos, serviços). Você nos
        concede uma licença limitada para hospedar e processar esse conteúdo exclusivamente para
        prestar o serviço.
      </p>

      <h2>8. Pagamentos, assinaturas e Paddle como Merchant of Record</h2>
      <p>
        Nosso processo de pedidos é conduzido pelo nosso revendedor online <strong>Paddle.com</strong>.
        A Paddle.com é a Merchant of Record (MoR) de todos os nossos pedidos. A Paddle realiza o
        atendimento de todas as consultas de clientes relacionadas a pagamentos e cuida das devoluções.
      </p>
      <p>
        Os termos de pagamento, cobrança, renovação, cancelamento, impostos e reembolsos seguem os{" "}
        <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noreferrer">
          Termos do Comprador da Paddle
        </a>
        . As assinaturas renovam-se automaticamente pelo período contratado até cancelamento.
      </p>

      <h2>9. Disponibilidade</h2>
      <p>
        Nos esforçamos para manter o serviço disponível, mas não garantimos operação ininterrupta ou
        livre de erros. Podemos realizar manutenções programadas ou de emergência.
      </p>

      <h2>10. Garantias e responsabilidade</h2>
      <p>
        Na máxima extensão permitida por lei, o serviço é fornecido "como está", sem garantias
        implícitas de adequação a um propósito específico. Nossa responsabilidade agregada está
        limitada ao valor pago por você nos 12 meses anteriores ao evento que originou a reclamação,
        excluindo danos indiretos, lucros cessantes ou perda de dados.
      </p>

      <h2>11. Suspensão e rescisão</h2>
      <p>
        Podemos suspender ou encerrar o acesso em caso de violação destes Termos, inadimplência,
        risco de fraude ou segurança, ou violações repetidas das nossas políticas. Você pode
        cancelar sua assinatura a qualquer momento pelo painel ou pela Paddle.
      </p>

      <h2>12. Lei aplicável e foro</h2>
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do
        domicílio do consumidor para dirimir controvérsias.
      </p>

      <h2>13. Contato</h2>
      <p>
        Dúvidas sobre estes Termos podem ser enviadas para o canal de suporte disponibilizado dentro
        da Belle Nails.
      </p>
    </LegalLayout>
  );
}
