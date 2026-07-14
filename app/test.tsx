"use client";

import { orpc } from "@/orpc/client";
import { useQuery } from "@tanstack/react-query";

export const Test = () => {
  const { data } = useQuery(orpc.ping.queryOptions());

  return <div>{data}</div>;
};
