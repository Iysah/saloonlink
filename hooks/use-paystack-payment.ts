"use client";

import { PaymentConfigProps } from "@/types/global.type";
import { HookConfig } from "react-paystack/dist/types";

export const paymentConfig = ({
  reference,
  email,
  amount,
  currency
}: PaymentConfigProps) => {

  const configuration: HookConfig = {
    reference: reference,
    email,
    amount: amount ? amount * 100 : 0,
    currency,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_KEY ?? "",

  };
  return configuration;
};
