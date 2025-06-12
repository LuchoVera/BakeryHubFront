import { useState, useEffect } from "react";
import {
  DashboardQueryParametersDto,
  DashboardResponseDto,
  ApiErrorResponse,
} from "../types";
import { AxiosError } from "axios";
import { fetchAdminDashboardStatistics } from "../services/apiService";

export const useDashboardData = (params: DashboardQueryParametersDto) => {
  const [data, setData] = useState<DashboardResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      if (
        params.timePeriod === "customrange" &&
        (!params.customStartDate || !params.customEndDate)
      ) {
        setData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const responseData = await fetchAdminDashboardStatistics(params);

        setData(responseData);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        if (axiosError.name === "CanceledError") {
          return;
        }
        setError(
          axiosError.response?.data?.title ||
            axiosError.response?.data?.detail ||
            axiosError.message ||
            "Error al cargar los datos del dashboard."
        );
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [JSON.stringify(params)]);

  return { data, isLoading, error };
};
