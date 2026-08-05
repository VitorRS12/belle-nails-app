import { getPaddleEnvironment } from "@/lib/paddle";
import { useTranslation } from "react-i18next";

export function PaymentTestModeBanner() {
  const { t } = useTranslation("common");
  if (getPaddleEnvironment() !== "sandbox") return null;
  return (
    <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-xs text-orange-800">
      {t("paymentTestModeBanner.message")}
    </div>
  );
}
