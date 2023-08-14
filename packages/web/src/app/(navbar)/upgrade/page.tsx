import { PricingCard } from "@components/PricingCard";
import { Button } from "@components/ui/button";
import { getSessionTokenFromCookies } from "@services/server-only/session";
import { validSession } from "@services/session";
import { getUserQueryCounts } from "@services/user/query-count";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UpgradePage() {
  const { isValid, userInfo, token } = await validSession(
    getSessionTokenFromCookies()
  );
  if (!isValid) {
    return redirect("/login");
  }

  const { queryCounts } = await getUserQueryCounts(userInfo.id, {
    token,
    limit: 1,
  });

  const dayQueries = queryCounts.find((qc) => {
    const today = new Date();
    const qcDate = new Date(qc.date);
    return (
      qcDate.getFullYear() === today.getFullYear() &&
      qcDate.getMonth() === today.getMonth() &&
      qcDate.getDate() === today.getDate()
    );
  });

  let remainingQueries: number = userInfo.maxQueryCount;
  if (dayQueries) {
    remainingQueries = userInfo.maxQueryCount - dayQueries.count;
  }

  return (
    <div className="flex flex-col w-full h-full py-5 space-y-4 place-items-center">
      <div className="flex flex-col space-y-2 text-xl text-center">
        <h1>Remaining Queries:</h1>
        <h2 className="text-md">
          <span
            className={`${
              remainingQueries < 5
                ? "text-red-500"
                : remainingQueries < 10
                ? "text-yellow-500"
                : "text-green-500"
            }`}
          >
            {remainingQueries}
          </span>{" "}
          of {userInfo.maxQueryCount}
        </h2>
        <Link
          href={"https://checkout.revelationsai.com/p/login/bIY5mO0MW95xgQ8288"}
          target="_blank"
        >
          <Button className="text-white bg-slate-700 hover:bg-slate-900">
            View Current Plan
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3">
        <PricingCard
          title="Late to Sunday Service"
          price="Free"
          features={["25 Daily Queries"]}
          currentLevel={userInfo.maxQueryCount >= 25}
        />
        <PricingCard
          title="Serve Staff"
          price="$5/month"
          features={["50 Daily Queries"]}
          currentLevel={userInfo.maxQueryCount >= 50}
          purchaseLink="https://checkout.revelationsai.com/b/4gwcNg8Ev5aB5G0144"
        />
        <PricingCard
          title="Youth Pastor"
          price="$10/month"
          features={["100 Daily Queries"]}
          currentLevel={userInfo.maxQueryCount >= 100}
          purchaseLink="https://checkout.revelationsai.com/b/6oEdRk4of46x7O86op"
        />
        <PricingCard
          title="Worship Leader"
          price="$25/month"
          features={["250 Daily Queries"]}
          currentLevel={userInfo.maxQueryCount >= 250}
          purchaseLink="https://checkout.revelationsai.com/b/fZe9B46wn46x9Wg5km"
        />
        <PricingCard
          title="Lead Pastor"
          price="$50/month"
          features={["500 Daily Queries"]}
          currentLevel={userInfo.maxQueryCount >= 500}
          purchaseLink="https://checkout.revelationsai.com/b/4gw4gKg6X1Yp4BWbIL"
        />
        <PricingCard
          title="Church Plant"
          price="$100/month"
          features={["Unlimited Daily Queries"]}
          currentLevel={userInfo.maxQueryCount === Infinity}
          purchaseLink="https://checkout.revelationsai.com/b/fZebJc2g7dH79WgbIM"
        />
      </div>
    </div>
  );
}
