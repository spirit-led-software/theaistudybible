"use client";

import { useIndexOps } from "@hooks/index-ops";
import { IndexOperation } from "@revelationsai/core/database/model";
import Moment from "moment";

export function IndexOperationsDashboard({
  initIndexOps,
}: {
  initIndexOps?: IndexOperation[];
}) {
  const { indexOps } = useIndexOps(
    initIndexOps,
    {
      limit: initIndexOps?.length
        ? initIndexOps.length < 100
          ? 100
          : initIndexOps.length
        : 100,
    },
    {
      refreshInterval: 20000,
    }
  );

  return (
    <div className="flex flex-col w-full space-y-2">
      <h1 className="text-xl font-bold">Index Operation Status</h1>
      {indexOps.length > 0 ? (
        <div className="w-full overflow-scroll border max-h-96">
          <table className="text-left divide-y table-fixed divide-slate-800 whitespace-nowrap">
            <thead>
              <tr className="divide-x divide-slate-800 bg-slate-200">
                <th className="px-2 py-1">ID</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Created</th>
                <th className="px-2 py-1">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y-2">
              {indexOps.map((indexOp) => (
                <tr key={indexOp.id} className="divide-x-2">
                  <td className="px-2 py-1">{indexOp.id}</td>
                  <td
                    className={`px-2 py-1 ${
                      indexOp.status === "FAILED"
                        ? "text-red-500"
                        : indexOp.status === "COMPLETED"
                        ? "text-green-500"
                        : "text-yellow-500"
                    }`}
                  >
                    {indexOp.status}
                  </td>
                  <td className="px-2 py-1">
                    {Moment(indexOp.createdAt).format("M/d/Y h:mma")}
                  </td>
                  <td className="px-2 py-1">
                    {indexOp.metadata ? (
                      <table className="table-fixed">
                        <tbody>
                          {Object.entries(indexOp.metadata as any).map(
                            ([key, value]) => (
                              <tr key={key} className="divide-x-2">
                                <td className="pr-2">{key}</td>
                                <td className="w-20 overflow-x-hidden truncate over">
                                  {JSON.stringify(value as any)}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    ) : (
                      "None"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>None yet</div>
      )}
    </div>
  );
}
