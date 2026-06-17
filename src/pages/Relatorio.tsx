// Página antiga de Relatório foi movida para dentro do Dashboard (aba "Relatório").
// Mantida apenas como redirecionamento para compatibilidade.
import { Navigate } from "react-router-dom";

const Relatorio = () => <Navigate to="/dashboard" replace state={{ tab: "relatorio" }} />;

export default Relatorio;
