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
    <div className="flex flex-col justify-between px-5 m-3 rounded-lg py-7 bg-slate-200">
      <div className="flex flex-col w-full mb-3 space-y-4">
        <h1 className="text-lg italic font-kanit">{title}</h1>
        <h2 className="text-slate-700 font-kanit">{price}</h2>
        <ul>
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col w-full">
        {!currentLevel && price !== "Free" && (
          <Link href={purchaseLink ?? ""} target="_blank" className="block">
            <Button className="w-full bg-blue-300 hover:bg-blue-400">
              Purchase
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}