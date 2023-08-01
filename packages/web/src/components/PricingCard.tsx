import Link from "next/link";
import { Button } from "./ui/button";

export function PricingCard({
  title,
  price,
  features,
  currentLevel = false,
  purchaseLink,
}: {
  title: string;
  price: string;
  features: string[];
  currentLevel?: boolean;
  purchaseLink?: string;
}) {
  return (
    <div className="flex flex-col px-5 m-3 space-y-4 rounded-lg py-7 bg-slate-200">
      <h1 className="text-lg italic font-kanit">{title}</h1>
      <h2 className="text-slate-700 font-kanit">{price}</h2>
      <ul>
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      {!currentLevel && price !== "Free" && (
        <Link href={purchaseLink ?? ""}>
          <Button className="bg-blue-300 hover:bg-blue-400">Purchase</Button>
        </Link>
      )}
    </div>
  );
}
