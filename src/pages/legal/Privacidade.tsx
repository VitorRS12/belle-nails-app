import { LegalLayout } from "./LegalLayout";

export default function Privacidade() {
  return (
    <LegalLayout title="Política de Privacidade">
      <h2>1. Quem somos</h2>
      <p>
        Esta Política descreve como <strong>Edelson Vitor dos Santos Dutra</strong>, pessoa física
        inscrita no CPF sob o nº <strong>065.235.185-90</strong>, atuando comercialmente sob o nome{" "}
        <strong>Belle Nails</strong> ("Belle Nails", "nós"), trata dados pessoais. Para os dados
        que coletamos diretamente de você (cadastro, uso do serviço), a Belle Nails atua como{" "}
        <em>controladora</em> dos dados pessoais, nos termos da LGPD (Lei nº 13.709/2018).
      </p>

      <h2>2. Dados que coletamos</h2>
      <ul>
        <li><strong>Conta:</strong> nome, e-mail, telefone, credenciais de login.</li>
        <li><strong>Dados do negócio:</strong> nome da empresa, profissionais, serviços, horários.</li>
        <li><strong>Dados de clientes finais</strong> inseridos por você (nome, telefone, e-mail, histórico de agendamentos).</li>
        <li><strong>Uso e telemetria:</strong> páginas acessadas, ações realizadas, identificadores de dispositivo, endereço IP, logs de erro.</li>
        <li><strong>Comunicações:</strong> mensagens enviadas ao suporte.</li>
      </ul>

      <h2>3. Finalidades e bases legais</h2>
      <ul>
        <li>Criação e manutenção da conta — <em>execução de contrato</em>.</li>
        <li>Prestação do serviço de agenda, notificações e relatórios — <em>execução de contrato</em>.</li>
        <li>Segurança, prevenção a fraudes e melhoria do produto — <em>legítimo interesse</em>.</li>
        <li>Atendimento ao cliente — <em>execução de contrato</em> / <em>legítimo interesse</em>.</li>
        <li>Comunicações de marketing — <em>consentimento</em>, com opção de descadastro.</li>
        <li>Cumprimento de obrigações fiscais e legais — <em>obrigação legal</em>.</li>
      </ul>

      <h2>4. Compartilhamento</h2>
      <p>Compartilhamos dados apenas com as seguintes categorias de destinatários:</p>
      <ul>
        <li><strong>Provedores de infraestrutura</strong> (hospedagem, banco de dados, e-mail transacional);</li>
        <li><strong>Paddle.com</strong>, nosso Merchant of Record, para processamento de pagamentos, gestão de assinatura, faturamento e cumprimento de obrigações tributárias;</li>
        <li><strong>Provedores de análise e suporte</strong> que nos auxiliam a operar o serviço;</li>
        <li><strong>Consultores profissionais</strong> (jurídico, contábil), quando necessário;</li>
        <li><strong>Autoridades públicas</strong>, quando exigido por lei ou ordem judicial.</li>
      </ul>

      <h2>5. Retenção</h2>
      <p>
        Mantemos os dados enquanto sua conta estiver ativa e pelo período necessário para cumprir
        as finalidades descritas, atender obrigações legais e exercer direitos em eventuais processos.
        Após esse prazo, os dados são excluídos ou anonimizados.
      </p>

      <h2>6. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais apropriadas para proteger os dados, incluindo
        criptografia em trânsito (HTTPS), controles de acesso baseados em função, segregação por
        organização e registro de auditoria em operações sensíveis.
      </p>

      <h2>7. Seus direitos (LGPD)</h2>
      <p>Você pode, a qualquer momento, solicitar:</p>
      <ul>
        <li>Confirmação e acesso aos seus dados;</li>
        <li>Correção de dados incompletos ou desatualizados;</li>
        <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
        <li>Portabilidade;</li>
        <li>Revogação do consentimento;</li>
        <li>Informação sobre compartilhamentos realizados.</li>
      </ul>
      <p>
        Para exercer seus direitos, utilize o canal de suporte dentro da Belle Nails. Responderemos
        no prazo previsto pela legislação aplicável.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Utilizamos cookies essenciais para autenticação e funcionamento do serviço, e cookies
        analíticos para entender o uso da plataforma. Você pode gerenciar cookies nas configurações
        do seu navegador.
      </p>

      <h2>9. Alterações</h2>
      <p>
        Podemos atualizar esta Política periodicamente. Mudanças relevantes serão comunicadas pelo
        próprio aplicativo ou por e-mail.
      </p>

      <h2>10. Contato</h2>
      <p>
        Dúvidas sobre privacidade podem ser enviadas pelo canal de suporte dentro da Belle Nails.
      </p>
    </LegalLayout>
  );
}
