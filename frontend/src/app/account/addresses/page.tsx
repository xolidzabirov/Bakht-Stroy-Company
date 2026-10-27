import type { Metadata } from "next";
import { AddressManager } from "@/features/manage-addresses/ui/AddressManager";
import { userFetch } from "@/shared/api/session";
import type { Address } from "@/shared/api/types";
import { getI18n } from "@/shared/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.acc.addresses.title, robots: { index: false } };
}

export default async function AccountAddressesPage() {
  const { data } = await userFetch<{ data: Address[] }>("/me/addresses");

  return <AddressManager addresses={data} />;
}
